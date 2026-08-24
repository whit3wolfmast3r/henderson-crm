import os
import json
import sqlite3

def export_db_to_json():
    db_path = "localBiz.db"
    json_dir = "data"
    json_path = os.path.join(json_dir, "businesses.json")
    crm_path = os.path.join(json_dir, "crm.json")
    
    os.makedirs(json_dir, exist_ok=True)

    if not os.path.exists(crm_path):
        with open(crm_path, "w", encoding="utf-8") as f:
            json.dump({}, f)

    if not os.path.exists(db_path):
        print(f"Warning: '{db_path}' not found.")
        return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    rows = cursor.execute("""
        SELECT id, entity_name, dba, all_licenses, total_licenses, license_sub_types,
               address, city, state, zip_code, municipal_phone,
               place_id, google_name, formatted_address, website, phone_number,
               primary_category, categories, rating, user_ratings_total, business_status
        FROM businesses
    """).fetchall()
    
    data = [dict(row) for row in rows]
    conn.close()

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(',', ':'))
    print(f"  Exported {len(data)} businesses to '{json_path}'.")

files = {
    "package.json": json.dumps({
        "name": "localbiz-app",
        "version": "1.0.0",
        "private": True,
        "scripts": {
            "dev": "next dev",
            "build": "next build",
            "start": "next start"
        },
        "dependencies": {
            "lucide-react": "^0.475.0",
            "next": "14.2.15",
            "react": "^18.3.1",
            "react-dom": "^18.3.1"
        },
        "devDependencies": {
            "autoprefixer": "^10.4.20",
            "postcss": "^8.4.49",
            "tailwindcss": "^3.4.17"
        }
    }, indent=2),

    "tailwind.config.js": """/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
""",

    "postcss.config.js": """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
""",

    "app/layout.js": """import './globals.css';

export const metadata = {
  title: 'LocalBiz Sales CRM & Directory | Henderson, NV',
  description: 'Verified business outreach CRM with RingCentral dialer & SOS integration',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
""",

    "app/globals.css": """@tailwind base;
@tailwind components;
@tailwind utilities;
""",

    "app/api/crm/route.js": """import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const crmPath = path.resolve(process.cwd(), 'data', 'crm.json');

function getCrmData() {
  if (fs.existsSync(crmPath)) {
    try {
      return JSON.parse(fs.readFileSync(crmPath, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, notes, disposition, decision_maker } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing business ID' }, { status: 400 });
    }

    const crmData = getCrmData();
    crmData[id] = {
      notes: notes ?? crmData[id]?.notes ?? '',
      disposition: disposition ?? crmData[id]?.disposition ?? 'Not Contacted',
      decision_maker: decision_maker ?? crmData[id]?.decision_maker ?? '',
      updated_at: new Date().toISOString()
    };

    fs.writeFileSync(crmPath, JSON.stringify(crmData, null, 2), 'utf8');
    return NextResponse.json({ success: true, record: crmData[id] });
  } catch (error) {
    console.error('CRM Save Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
""",

    "app/api/businesses/route.js": """import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let cachedBusinesses = null;

function loadBusinesses() {
  if (!cachedBusinesses) {
    const jsonPath = path.resolve(process.cwd(), 'data', 'businesses.json');
    if (fs.existsSync(jsonPath)) {
      cachedBusinesses = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } else {
      cachedBusinesses = [];
    }
  }
  return cachedBusinesses;
}

function loadCrmMap() {
  const crmPath = path.resolve(process.cwd(), 'data', 'crm.json');
  if (fs.existsSync(crmPath)) {
    try {
      return JSON.parse(fs.readFileSync(crmPath, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get('q') || '').toLowerCase().trim();
  const category = searchParams.get('category') || '';
  const disposition = searchParams.get('disposition') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 24;

  try {
    const rawBusinesses = loadBusinesses();
    const crmMap = loadCrmMap();

    // Merge CRM notes, disposition, decision maker
    const merged = rawBusinesses.map(b => {
      const crm = crmMap[b.id] || {};
      return {
        ...b,
        notes: crm.notes || '',
        disposition: crm.disposition || 'Not Contacted',
        decision_maker: crm.decision_maker || '',
        updated_at: crm.updated_at || null
      };
    });

    // Compute Category counts
    const catCounts = {};
    for (const b of merged) {
      if (b.primary_category) {
        catCounts[b.primary_category] = (catCounts[b.primary_category] || 0) + 1;
      }
    }
    const topCategories = Object.entries(catCounts)
      .map(([primary_category, count]) => ({ primary_category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Filter pipeline
    let filtered = merged;

    if (category && category !== 'All') {
      filtered = filtered.filter(b => b.primary_category === category);
    }

    if (disposition && disposition !== 'All') {
      filtered = filtered.filter(b => b.disposition === disposition);
    }

    if (search) {
      filtered = filtered.filter(b => {
        const entity = (b.entity_name || '').toLowerCase();
        const dba = (b.dba || '').toLowerCase();
        const addr = (b.formatted_address || b.address || '').toLowerCase();
        const dm = (b.decision_maker || '').toLowerCase();
        const phone = (b.phone_number || b.municipal_phone || '').toLowerCase();
        const notes = (b.notes || '').toLowerCase();
        return entity.includes(search) || dba.includes(search) || addr.includes(search) || dm.includes(search) || phone.includes(search) || notes.includes(search);
      });
    }

    // Sort: records with pending Callbacks/Interested first, then by rating
    filtered.sort((a, b) => {
      const priority = { 'Callback': 1, 'Interested': 2, 'Not Contacted': 3, 'Left Voicemail': 4, 'Gatekeeper': 5, 'Not Interested': 6, 'Do Not Call': 7 };
      const pA = priority[a.disposition] || 99;
      const pB = priority[b.disposition] || 99;
      if (pA !== pB) return pA - pB;
      return (b.rating || 0) - (a.rating || 0);
    });

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      businesses: paginated,
      categories: topCategories,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
""",

    "app/page.js": """'use client';
import { useState, useEffect } from 'react';
import { 
  Search, Globe, Phone, Star, MapPin, Building2, PhoneCall, 
  UserCheck, ExternalLink, Save, Check, Copy, FileText, ChevronRight
} from 'lucide-react';

const DISPOSITIONS = [
  'All',
  'Not Contacted',
  'Interested',
  'Callback',
  'Left Voicemail',
  'Gatekeeper',
  'Not Interested',
  'Do Not Call'
];

const DISPOSITION_COLORS = {
  'Not Contacted': 'bg-slate-800 text-slate-300 border-slate-700',
  'Interested': 'bg-emerald-950/80 text-emerald-400 border-emerald-700',
  'Callback': 'bg-amber-950/80 text-amber-300 border-amber-700',
  'Left Voicemail': 'bg-sky-950/80 text-sky-300 border-sky-700',
  'Gatekeeper': 'bg-purple-950/80 text-purple-300 border-purple-700',
  'Not Interested': 'bg-rose-950/80 text-rose-400 border-rose-800',
  'Do Not Call': 'bg-red-950 text-red-500 border-red-900',
};

export default function SalesCRM() {
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedDisp, setSelectedDisp] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [savedStatus, setSavedStatus] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses?q=${encodeURIComponent(search)}&category=${encodeURIComponent(selectedCat)}&disposition=${encodeURIComponent(selectedDisp)}&page=${page}`);
      const data = await res.json();
      setBusinesses(data.businesses || []);
      setCategories(data.categories || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [selectedCat, selectedDisp, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBusinesses();
  };

  const updateBusinessState = (id, field, value) => {
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const saveCrmRecord = async (biz) => {
    try {
      setSavedStatus(prev => ({ ...prev, [biz.id]: 'saving' }));
      await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json.stringify ? JSON.stringify({
          id: biz.id,
          notes: biz.notes,
          disposition: biz.disposition,
          decision_maker: biz.decision_maker
        }) : JSON.stringify({
          id: biz.id,
          notes: biz.notes,
          disposition: biz.disposition,
          decision_maker: biz.decision_maker
        })
      });
      setSavedStatus(prev => ({ ...prev, [biz.id]: 'saved' }));
      setTimeout(() => {
        setSavedStatus(prev => ({ ...prev, [biz.id]: null }));
      }, 2000);
    } catch (e) {
      console.error(e);
      setSavedStatus(prev => ({ ...prev, [biz.id]: 'error' }));
    }
  };

  const handleSosSearch = (entityName) => {
    navigator.clipboard.writeText(entityName);
    window.open('https://esos.nv.gov/EntitySearch/OnlineEntitySearch', '_blank');
  };

  const copyPhone = (id, phone) => {
    const clean = phone.replace(/[^0-9]/g, '');
    navigator.clipboard.writeText(clean);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Building2 className="text-cyan-400 w-7 h-7" /> Henderson Business Sales & Outreach CRM
          </h1>
          <p className="text-slate-400 text-xs mt-1">Verified Local Businesses • RingCentral Dialer • Instant NV SOS Lookup</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-lg text-slate-300">
            Total Leads: <span className="text-cyan-400 font-bold">{pagination.total.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Control Bar: Search & Dispositions */}
      <div className="space-y-3 mb-6">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business name, DBA, decision maker, phone, keyword, or street address..."
            className="w-full pl-12 pr-28 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner text-sm"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            Search
          </button>
        </form>

        {/* Disposition Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">Disposition:</span>
          {DISPOSITIONS.map((disp) => (
            <button
              key={disp}
              onClick={() => { setSelectedDisp(disp); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition border ${
                selectedDisp === disp
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {disp}
            </button>
          ))}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">Category:</span>
          <button
            onClick={() => { setSelectedCat('All'); setPage(1); }}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition border ${
              selectedCat === 'All' 
                ? 'bg-slate-200 text-slate-950 font-bold border-white' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.primary_category}
              onClick={() => { setSelectedCat(c.primary_category); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition border ${
                selectedCat === c.primary_category 
                  ? 'bg-slate-200 text-slate-950 font-bold border-white' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {c.primary_category} ({c.count})
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Business Outreach Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <p className="text-slate-400">No matching business leads found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {businesses.map((biz) => {
            const displayName = biz.dba || biz.entity_name;
            const targetPhone = biz.phone_number || biz.municipal_phone || '';
            const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
            const isSaving = savedStatus[biz.id] === 'saving';
            const isSaved = savedStatus[biz.id] === 'saved';

            return (
              <div
                key={biz.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 flex flex-col justify-between transition-all shadow-md hover:shadow-cyan-950/20"
              >
                <div>
                  {/* Top Header & Rating */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-white line-clamp-1">{displayName}</h3>
                      {biz.entity_name !== biz.dba && biz.dba && (
                        <p className="text-xs text-slate-400 font-mono truncate">Legal: {biz.entity_name}</p>
                      )}
                    </div>
                    {biz.rating > 0 && (
                      <div className="flex items-center gap-1 bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded text-xs font-semibold shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{biz.rating.toFixed(1)}</span>
                        <span className="text-slate-500">({biz.user_ratings_total})</span>
                      </div>
                    )}
                  </div>

                  {/* Primary Category & Address */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {biz.primary_category && (
                      <span className="bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                        {biz.primary_category}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[220px]">{biz.formatted_address || biz.address}</span>
                    </span>
                  </div>

                  {/* Action Bar: RingCentral Dialer + NV SOS Lookup + Website */}
                  <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    {/* RingCentral / Phone Trigger */}
                    {cleanPhone ? (
                      <div className="col-span-2 flex items-center gap-1">
                        <a
                          href={`rcapp://r/call?number=${cleanPhone}`}
                          title="Click to dial with RingCentral App"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs py-1.5 px-2 rounded transition"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Call RC
                        </a>
                        <a
                          href={`tel:${cleanPhone}`}
                          title="Direct System Dial"
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 px-2.5 rounded transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => copyPhone(biz.id, targetPhone)}
                          title="Copy Raw Phone Number"
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 px-2 rounded transition"
                        >
                          {copiedId === biz.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <div className="col-span-2 text-center text-xs text-slate-600 py-1.5 bg-slate-900 rounded">
                        No phone on file
                      </div>
                    )}

                    {/* Instant SOS Entity Search */}
                    <button
                      onClick={() => handleSosSearch(biz.entity_name)}
                      title="Copies legal entity name & opens Nevada SOS search"
                      className="inline-flex items-center justify-center gap-1 bg-amber-950/70 hover:bg-amber-900 border border-amber-800/60 text-amber-300 text-xs py-1.5 px-2 rounded transition font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> NV SOS
                    </button>
                  </div>

                  {/* Decision Maker & Disposition Fields */}
                  <div className="space-y-2.5 mb-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-cyan-400" /> Decision Maker
                        </label>
                        <input
                          type="text"
                          value={biz.decision_maker || ''}
                          onChange={(e) => updateBusinessState(biz.id, 'decision_maker', e.target.value)}
                          placeholder="Owner / GM Name..."
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                          Call Disposition
                        </label>
                        <select
                          value={biz.disposition || 'Not Contacted'}
                          onChange={(e) => updateBusinessState(biz.id, 'disposition', e.target.value)}
                          className={`w-full border rounded px-2 py-1 text-xs font-semibold focus:outline-none ${
                            DISPOSITION_COLORS[biz.disposition] || 'bg-slate-900 text-white border-slate-800'
                          }`}
                        >
                          {DISPOSITIONS.filter(d => d !== 'All').map(d => (
                            <option key={d} value={d} className="bg-slate-900 text-white">
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Note Taking Box */}
                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-cyan-400" /> Outreach Notes
                      </label>
                      <textarea
                        rows={2}
                        value={biz.notes || ''}
                        onChange={(e) => updateBusinessState(biz.id, 'notes', e.target.value)}
                        placeholder="Log conversation, objections, callback time, or email..."
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Action: Save CRM Record + Website link */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => saveCrmRecord(biz)}
                    disabled={isSaving}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                      isSaved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isSaving ? (
                      'Saving...'
                    ) : isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-cyan-400" /> Save CRM Note
                      </>
                    )}
                  </button>

                  {biz.website && (
                    <a
                      href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs py-1.5 px-2.5 rounded-lg transition"
                    >
                      <Globe className="w-3.5 h-3.5 text-cyan-400" /> Web
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-slate-800 transition"
          >
            Previous
          </button>
          <span className="text-xs text-slate-400">
            Page <span className="text-white font-semibold">{page}</span> of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-slate-800 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
"""
}

def generate_app():
    print("Scaffolding CRM Next.js application...")
    for file_path, content in files.items():
        dir_name = os.path.dirname(file_path)
        if dir_name:
            os.makedirs(dir_name, exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  Created: {file_path}")
    
    export_db_to_json()
    print("\nCRM Workspace scaffolded successfully!")

if __name__ == "__main__":
    generate_app()