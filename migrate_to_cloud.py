import sqlite3
import json
import os
from supabase import create_client

SUPABASE_URL = "https://yxtbkhsgbswwmvmwwmib.supabase.co"
SUPABASE_KEY = "sb_secret_mgLLAcFCjxi8npt8v2FEIQ_GjEM1aQR"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 1. Read SQLite records
conn = sqlite3.connect("localBiz.db")
conn.row_factory = sqlite3.Row
rows = [dict(r) for r in conn.cursor().execute("SELECT * FROM businesses").fetchall()]
conn.close()

# 2. Merge local CRM notes if any exist
crm_map = {}
if os.path.exists("data/crm.json"):
    try:
        with open("data/crm.json", "r", encoding="utf-8") as f:
            crm_map = json.load(f)
    except Exception:
        crm_map = {}

payload = []
for r in rows:
    biz_id = str(r.get("id"))
    crm = crm_map.get(biz_id, {})
    
    record = {
        "id": biz_id,
        "entity_name": r.get("entity_name") or "",
        "dba": r.get("dba") or "",
        "all_licenses": r.get("all_licenses") or "",
        "total_licenses": int(r.get("total_licenses") or 1) if r.get("total_licenses") else 1,
        "license_sub_types": r.get("license_sub_types") or "",
        "address": r.get("address") or "",
        "city": r.get("city") or "Henderson",
        "state": r.get("state") or "NV",
        "zip_code": str(r.get("zip_code") or ""),
        "municipal_phone": r.get("municipal_phone") or "",
        "place_id": r.get("place_id") or "",
        "google_name": r.get("google_name") or "",
        "formatted_address": r.get("formatted_address") or "",
        "website": r.get("website") or "",
        "phone_number": r.get("phone_number") or "",
        "primary_category": r.get("primary_category") or "Uncategorized",
        "categories": r.get("categories") or "",
        "rating": float(r.get("rating")) if r.get("rating") is not None else 0.0,
        "user_ratings_total": int(r.get("user_ratings_total") or 0) if r.get("user_ratings_total") else 0,
        "business_status": r.get("business_status") or "OPERATIONAL",
        "decision_maker": crm.get("decision_maker") or "",
        "disposition": crm.get("disposition") or "Not Contacted",
        "notes": crm.get("notes") or ""
    }
    payload.append(record)

# 3. Batch upload
BATCH_SIZE = 500
total = len(payload)
print(f"Uploading {total} records to Supabase...")

for i in range(0, total, BATCH_SIZE):
    batch = payload[i:i + BATCH_SIZE]
    supabase.table("businesses").upsert(batch).execute()
    print(f"  ✓ Uploaded records {i + 1} - {min(i + BATCH_SIZE, total)}")

print("\nDatabase migration complete!")