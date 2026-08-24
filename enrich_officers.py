import os
import sqlite3
import time
import pandas as pd
from playwright.sync_api import sync_playwright

# Configuration
SOURCE_CSV = "businesses.csv"
CONDENSED_CSV = "businesses_condensed.csv"
OUTPUT_DB = "henderson_enriched.db"
OUTPUT_CSV = "henderson_businesses_with_officers.csv"
MAX_ENTITIES = 50  # Test batch of 50; change to None to run the entire list

def prepare_condensed_data():
    """Generates the condensed dataset directly from businesses.csv if needed."""
    if not os.path.exists(SOURCE_CSV):
        print(f"Error: Could not find '{SOURCE_CSV}' in {os.getcwd()}")
        return None

    print(f"Reading '{SOURCE_CSV}'...")
    df = pd.read_csv(SOURCE_CSV)

    # Normalize column names
    col_map = {c: c.strip().title() for c in df.columns}
    df.rename(columns=col_map, inplace=True)

    # Identify relevant columns
    sub_col = next((c for c in df.columns if 'sub-type' in c.lower() or 'subtype' in c.lower()), None)
    name_col = next((c for c in df.columns if 'entity name' in c.lower() or 'entity' in c.lower()), 'Entity Name')
    lic_col = next((c for c in df.columns if 'license number' in c.lower() or 'license' in c.lower()), 'License Number')
    dba_col = next((c for c in df.columns if 'dba' in c.lower()), 'DBA')

    # Exclude Door-to-Door, Gaming, and Manufacturing
    if sub_col:
        mask = df[sub_col].astype(str).str.contains('door-to-door|gaming|manufacturing', case=False, na=False)
        df = df[~mask].copy()

    # Clean and filter empty names
    df = df[df[name_col].notna()].copy()
    df[name_col] = df[name_col].astype(str).str.strip()
    df = df[~df[name_col].str.lower().isin(['entity name', 'entity_name', 'nan', ''])]

    # Group duplicate entities into single rows
    agg_rules = {lic_col: lambda x: "; ".join(x.dropna().astype(str).unique())}
    if dba_col in df.columns:
        agg_rules[dba_col] = lambda x: "; ".join(x.dropna().astype(str).unique())

    condensed_df = df.groupby(name_col).agg(agg_rules).reset_index()
    condensed_df.rename(columns={
        name_col: 'entity_name',
        lic_col: 'license_numbers',
        dba_col: 'dba_names' if dba_col in df.columns else lic_col
    }, inplace=True)

    condensed_df.to_csv(CONDENSED_CSV, index=False)
    print(f"Generated clean condensed list: {len(condensed_df)} unique businesses.")
    return condensed_df

def init_db():
    conn = sqlite3.connect(OUTPUT_DB)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sos_officers (
            entity_name TEXT PRIMARY KEY,
            license_numbers TEXT,
            nv_business_id TEXT,
            entity_status TEXT,
            registered_agent TEXT,
            officers_json TEXT,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    return conn

def enrich_businesses():
    # Prepare and load condensed dataset
    df = prepare_condensed_data()
    if df is None or len(df) == 0:
        return

    conn = init_db()
    cursor = conn.cursor()

    # Resume from un-scraped records
    existing = set(r[0] for r in cursor.execute("SELECT entity_name FROM sos_officers").fetchall())
    df_to_scrape = df[~df['entity_name'].isin(existing)].copy()

    if MAX_ENTITIES:
        df_to_scrape = df_to_scrape.head(MAX_ENTITIES)

    print(f"Ready to scrape {len(df_to_scrape)} businesses from NV Secretary of State.\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()
        page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        print("Navigating to Nevada Secretary of State...")
        page.goto("https://esos.nv.gov/EntitySearch/OnlineEntitySearch", timeout=60000)
        page.wait_for_load_state("domcontentloaded")
        time.sleep(3)

        for idx, (_, row) in enumerate(df_to_scrape.iterrows(), 1):
            entity_query = str(row['entity_name']).strip()
            license_val = str(row.get('license_numbers', '')).strip()

            print(f"[{idx}/{len(df_to_scrape)}] Searching: {entity_query}")

            try:
                if "OnlineEntitySearch" not in page.url:
                    page.goto("https://esos.nv.gov/EntitySearch/OnlineEntitySearch", timeout=30000)
                    time.sleep(1.5)

                input_field = page.locator("input[type='text']").first
                input_field.fill("")
                input_field.fill(entity_query)

                search_btn = page.locator("button:has-text('Search'), input[value='Search']").first
                search_btn.click()
                time.sleep(2)

                nv_id = ""
                status = ""
                agent = ""
                officers = []

                table_rows = page.locator("table tbody tr")
                if table_rows.count() > 0:
                    first_link = table_rows.first.locator("a").first
                    if first_link.count() > 0:
                        first_link.click()
                        time.sleep(2)

                        agent_elem = page.locator("text=Registered Agent").locator("xpath=..")
                        if agent_elem.count() > 0:
                            agent = agent_elem.first.inner_text().replace("Registered Agent", "").strip()

                        officer_rows = page.locator("table:has-text('Officer'), table:has-text('Title') tbody tr")
                        for r_idx in range(officer_rows.count()):
                            cols = [td.inner_text().strip() for td in officer_rows.nth(r_idx).locator("td").all()]
                            if cols:
                                officers.append(" - ".join(cols))

                cursor.execute("""
                    INSERT OR REPLACE INTO sos_officers 
                    (entity_name, license_numbers, nv_business_id, entity_status, registered_agent, officers_json)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (entity_query, license_val, nv_id, status, agent, "; ".join(officers)))
                conn.commit()

                time.sleep(1)

            except Exception as e:
                print(f"  Error on '{entity_query}': {e}")
                continue

        browser.close()

    conn.close()

    conn = sqlite3.connect(OUTPUT_DB)
    enriched_df = pd.read_sql_query("SELECT * FROM sos_officers", conn)
    enriched_df.to_csv(OUTPUT_CSV, index=False)
    conn.close()

    print(f"\nCompleted! Saved results to '{OUTPUT_DB}' and '{OUTPUT_CSV}'.")

if __name__ == "__main__":
    enrich_businesses()