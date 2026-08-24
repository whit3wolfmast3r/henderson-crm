import os
import sqlite3
import time
import pandas as pd
import requests

# -------------------------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------------------------
SOURCE_CSV = "businesses.csv"
OUTPUT_DB = "localBiz.db"
OUTPUT_CSV = "henderson_businesses_enriched.csv"
GOOGLE_API_KEY = "AIzaSyCd2PrpOur62HvnEQxfNucThI0cHktZn_o"
BATCH_LIMIT = None  # Process all unique businesses (or set to e.g. 50 for testing)

EXCLUDED_SUBTYPES = [
    "door-to-door solicitor and peddler",
    "gaming",
    "manufacturing",
    "retail marijuana manufacturing facility"
]

# -------------------------------------------------------------------------
# DATABASE INITIALIZATION
# -------------------------------------------------------------------------
def init_db():
    conn = sqlite3.connect(OUTPUT_DB)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS businesses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_name TEXT NOT NULL,
            dba TEXT,
            all_licenses TEXT,
            total_licenses INTEGER,
            license_sub_types TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            zip_code TEXT,
            municipal_phone TEXT,
            place_id TEXT,
            google_name TEXT,
            formatted_address TEXT,
            website TEXT,
            phone_number TEXT,
            primary_category TEXT,
            categories TEXT,
            rating REAL,
            user_ratings_total INTEGER,
            business_status TEXT,
            enriched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_entity_name ON businesses(entity_name);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_place_id ON businesses(place_id);")
    conn.commit()
    return conn

# -------------------------------------------------------------------------
# DYNAMIC COLUMN RESOLUTION & CLEANING
# -------------------------------------------------------------------------
def find_col(columns, keywords):
    for kw in keywords:
        for col in columns:
            cleaned = col.lower().replace("_", " ").replace("-", " ").strip()
            if kw in cleaned:
                return col
    return None

def load_and_clean_data():
    if not os.path.exists(SOURCE_CSV):
        print(f"Error: '{SOURCE_CSV}' not found in {os.getcwd()}")
        return None

    df = pd.read_csv(SOURCE_CSV)
    cols = df.columns.tolist()

    name_col = find_col(cols, ['entity name', 'entity']) or cols[0]
    lic_col = find_col(cols, ['all license numbers', 'license number', 'license'])
    sub_col = find_col(cols, ['license sub types', 'sub type', 'subtype', 'sub_type', 'type'])
    dba_col = find_col(cols, ['dba names', 'dba'])
    loc_col = find_col(cols, ['business locations', 'business location', 'location', 'address 1', 'address'])
    city_col = find_col(cols, ['city'])
    state_col = find_col(cols, ['state'])
    zip_col = find_col(cols, ['zip codes', 'zip code', 'zip'])
    phone_col = find_col(cols, ['primary phone', 'business phone', 'phone'])

    # 1. Filter out excluded categories
    if sub_col and sub_col in df.columns:
        pattern = "|".join(EXCLUDED_SUBTYPES)
        mask = df[sub_col].astype(str).str.contains(pattern, case=False, na=False)
        df = df[~mask].copy()

    # 2. Drop empty entities and header artifacts
    df = df[df[name_col].notna()].copy()
    df[name_col] = df[name_col].astype(str).str.strip()
    df = df[~df[name_col].str.lower().isin(['entity name', 'entity_name', 'nan', ''])]

    # 3. Aggregate duplicates into single records
    agg_dict = {}
    if lic_col and lic_col in df.columns:
        agg_dict[lic_col] = lambda x: ", ".join(x.dropna().astype(str).unique())
    if dba_col and dba_col in df.columns:
        agg_dict[dba_col] = lambda x: next((str(v).strip() for v in x if pd.notna(v) and str(v).strip() and str(v).lower() != 'nan'), '')
    if sub_col and sub_col in df.columns:
        agg_dict[sub_col] = lambda x: ", ".join(x.dropna().astype(str).unique())
    if loc_col and loc_col in df.columns:
        agg_dict[loc_col] = lambda x: next((str(v).strip() for v in x if pd.notna(v) and str(v).strip()), '')
    if city_col and city_col in df.columns:
        agg_dict[city_col] = lambda x: next((str(v).strip() for v in x if pd.notna(v) and str(v).strip()), 'Henderson')
    if state_col and state_col in df.columns:
        agg_dict[state_col] = lambda x: next((str(v).strip() for v in x if pd.notna(v) and str(v).strip()), 'NV')
    if zip_col and zip_col in df.columns:
        agg_dict[zip_col] = lambda x: next((str(v).strip() for v in x if pd.notna(v) and str(v).strip()), '')
    if phone_col and phone_col in df.columns:
        agg_dict[phone_col] = lambda x: next((str(v).strip() for v in x if pd.notna(v) and str(v).strip()), '')

    if agg_dict:
        grouped = df.groupby(name_col).agg(agg_dict).reset_index()
    else:
        grouped = df[[name_col]].drop_duplicates().reset_index(drop=True)

    clean_df = pd.DataFrame()
    clean_df['entity_name'] = grouped[name_col]
    clean_df['dba'] = grouped[dba_col] if dba_col and dba_col in grouped.columns else ''
    clean_df['licenses'] = grouped[lic_col] if lic_col and lic_col in grouped.columns else ''
    clean_df['sub_types'] = grouped[sub_col] if sub_col and sub_col in grouped.columns else ''
    clean_df['address'] = grouped[loc_col] if loc_col and loc_col in grouped.columns else ''
    clean_df['city'] = grouped[city_col] if city_col and city_col in grouped.columns else 'Henderson'
    clean_df['state'] = grouped[state_col] if state_col and state_col in grouped.columns else 'NV'
    clean_df['zip_code'] = grouped[zip_col] if zip_col and zip_col in grouped.columns else ''
    clean_df['phone'] = grouped[phone_col] if phone_col and phone_col in grouped.columns else ''
    clean_df['total_licenses'] = df.groupby(name_col)[lic_col if lic_col else name_col].count().values

    return clean_df

# -------------------------------------------------------------------------
# GOOGLE PLACES ENRICHMENT
# -------------------------------------------------------------------------
def search_place(query):
    url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
    params = {
        "input": query,
        "inputtype": "textquery",
        "fields": "place_id,name,formatted_address,business_status",
        "key": GOOGLE_API_KEY
    }
    try:
        res = requests.get(url, params=params).json()
        candidates = res.get("candidates", [])
        return candidates[0] if candidates else None
    except Exception:
        return None

def get_place_details(place_id):
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "name,website,formatted_phone_number,types,rating,user_ratings_total,business_status,formatted_address",
        "key": GOOGLE_API_KEY
    }
    try:
        res = requests.get(url, params=params).json()
        return res.get("result", {})
    except Exception:
        return {}

def format_category(types_list):
    if not types_list:
        return "General Business", ""
    ignored = {"point_of_interest", "establishment"}
    clean_types = [t for t in types_list if t not in ignored]
    primary = clean_types[0].replace("_", " ").title() if clean_types else types_list[0].replace("_", " ").title()
    all_cats = ", ".join([t.replace("_", " ").title() for t in clean_types])
    return primary, all_cats

# -------------------------------------------------------------------------
# PIPELINE EXECUTION
# -------------------------------------------------------------------------
def run_pipeline():
    conn = init_db()
    cursor = conn.cursor()

    df = load_and_clean_data()
    if df is None or len(df) == 0:
        print("No records found to process.")
        return

    # Skip records already processed
    existing = set(r[0] for r in cursor.execute("SELECT entity_name FROM businesses").fetchall())
    queue = df[~df['entity_name'].isin(existing)].copy()

    if BATCH_LIMIT:
        queue = queue.head(BATCH_LIMIT)

    print(f"Total unique businesses ready for enrichment: {len(queue)}\n")

    for idx, (_, row) in enumerate(queue.iterrows(), 1):
        entity = str(row['entity_name']).strip()
        dba = str(row['dba']).strip()
        licenses = str(row['licenses']).strip()
        total_lic = int(row['total_licenses'])
        sub_types = str(row['sub_types']).strip()
        address = str(row['address']).strip()
        city = str(row['city']).strip()
        state = str(row['state']).strip()
        zip_code = str(row['zip_code']).strip()
        mun_phone = str(row['phone']).strip()

        # Construct search query: prefer DBA
        search_name = dba if dba and dba.lower() != 'nan' else entity
        query = f"{search_name}, {address}, {city}, {state}" if address else f"{search_name}, {city}, {state}"

        print(f"[{idx}/{len(queue)}] Enriching: {search_name}")

        place = search_place(query)
        if not place and address:
            place = search_place(f"{search_name}, {city}, {state}")

        place_id = ""
        g_name = ""
        g_address = ""
        website = ""
        phone = ""
        primary_cat = ""
        all_cats = ""
        rating = 0.0
        reviews = 0
        status = "OPERATIONAL"

        if place:
            place_id = place.get("place_id", "")
            details = get_place_details(place_id)
            g_name = details.get("name", "")
            g_address = details.get("formatted_address", "")
            website = details.get("website", "")
            phone = details.get("formatted_phone_number", "")
            primary_cat, all_cats = format_category(details.get("types", []))
            rating = details.get("rating", 0.0)
            reviews = details.get("user_ratings_total", 0)
            status = details.get("business_status", "OPERATIONAL")

        cursor.execute("""
            INSERT INTO businesses (
                entity_name, dba, all_licenses, total_licenses, license_sub_types,
                address, city, state, zip_code, municipal_phone,
                place_id, google_name, formatted_address, website, phone_number,
                primary_category, categories, rating, user_ratings_total, business_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            entity, dba, licenses, total_lic, sub_types,
            address, city, state, zip_code, mun_phone,
            place_id, g_name, g_address, website, phone,
            primary_cat, all_cats, rating, reviews, status
        ))
        conn.commit()
        time.sleep(0.08)

    # Export complete database to CSV
    export_df = pd.read_sql_query("SELECT * FROM businesses", conn)
    export_df.to_csv(OUTPUT_CSV, index=False)
    conn.close()

    print(f"\nPipeline finished! Output saved to '{OUTPUT_DB}' and '{OUTPUT_CSV}'.")

if __name__ == "__main__":
    run_pipeline()