'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Globe, Phone, Star, MapPin, Building2, 
  UserCheck, ExternalLink, Check, Copy, FileText, SearchCheck, Loader2
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

  const saveTimers = useRef({});

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

  const persistToApi = async (bizPayload) => {
    try {
      setSavedStatus(prev => ({ ...prev, [bizPayload.id]: 'saving' }));
      await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bizPayload.id,
          notes: bizPayload.notes,
          disposition: bizPayload.disposition,
          decision_maker: bizPayload.decision_maker
        })
      });
      setSavedStatus(prev => ({ ...prev, [bizPayload.id]: 'saved' }));
      setTimeout(() => {
        setSavedStatus(prev => ({ ...prev, [bizPayload.id]: null }));
      }, 2000);
    } catch (e) {
      console.error(e);
      setSavedStatus(prev => ({ ...prev, [bizPayload.id]: 'error' }));
    }
  };

  const queueAutoSave = useCallback((updatedBiz, delay = 700) => {
    const id = updatedBiz.id;
    if (saveTimers.current[id]) {
      clearTimeout(saveTimers.current[id]);
    }

    setSavedStatus(prev => ({ ...prev, [id]: 'typing' }));

    saveTimers.current[id] = setTimeout(() => {
      persistToApi(updatedBiz);
    }, delay);
  }, []);

  const updateBusinessField = (id, field, value, instantSave = false) => {
    setBusinesses(prev => {
      let targetBiz = null;
      const updated = prev.map(b => {
        if (b.id === id) {
          targetBiz = { ...b, [field]: value };
          return targetBiz;
        }
        return b;
      });

      if (targetBiz) {
        queueAutoSave(targetBiz, instantSave ? 50 : 700);
      }
      return updated;
    });
  };

  const cleanEntityName = (name) => {
    if (!name) return '';
    return name
      .replace(/\b(LLC|L\.L\.C\.|INC|INC\.|CORP|CORP\.|CO|CO\.|LTD|LTD\.|PLLC|LP|LLP)\b/gi, '')
      .replace(/[^\w\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Direct 1-click registries with preloaded GET URLs
  const openOpenCorporates = (entityName) => {
    const clean = cleanEntityName(entityName);
    window.open(`https://opencorporates.com/companies/us_nv?q=${encodeURIComponent(clean)}`, '_blank');
  };

  const openBizapedia = (entityName) => {
    const clean = cleanEntityName(entityName);
    window.open(`https://www.bizapedia.com/search.aspx?company=${encodeURIComponent(clean)}`, '_blank');
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
          <p className="text-slate-400 text-xs mt-1">10,000 Door Hanger Campaign • Instant Officer Registries • Auto-Saving CRM</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-lg text-slate-300">
            Total Leads: <span className="text-cyan-400 font-bold">{pagination.total.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Control Bar */}
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

        {/* Dispositions Filter */}
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

        {/* Categories Filter */}
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

      {/* Leads Grid */}
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
            const statusState = savedStatus[biz.id];

            return (
              <div
                key={biz.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 flex flex-col justify-between transition-all shadow-md hover:shadow-cyan-950/20"
              >
                <div>
                  {/* Card Header */}
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

                  {/* Category & Address */}
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

                  {/* Phone Display Bar */}
                  <div className="mb-3 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    {targetPhone ? (
                      <div className="flex items-center justify-between bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-lg">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="font-mono font-bold text-sm text-cyan-300 tracking-wide select-all truncate">
                            {targetPhone}
                          </span>
                        </div>
                        <button
                          onClick={() => copyPhone(biz.id, targetPhone)}
                          title="Copy phone number"
                          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition shrink-0 ml-1"
                        >
                          {copiedId === biz.id ? (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                              <Check className="w-3.5 h-3.5" /> Copied
                            </span>
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-xs text-slate-500 py-1.5 bg-slate-900/50 rounded-lg border border-slate-800">
                        No phone on file
                      </div>
                    )}
                  </div>

                  {/* Instant 1-Click Officer Registries */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={() => openOpenCorporates(biz.entity_name)}
                      title="Direct 1-click lookup on OpenCorporates Nevada"
                      className="inline-flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-1.5 px-2 rounded-lg transition shadow"
                    >
                      <SearchCheck className="w-3.5 h-3.5" /> OpenCorp NV
                    </button>
                    <button
                      onClick={() => openBizapedia(biz.entity_name)}
                      title="Direct 1-click lookup on Bizapedia Nevada"
                      className="inline-flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs py-1.5 px-2 rounded-lg transition font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Bizapedia NV
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
                          onChange={(e) => updateBusinessField(biz.id, 'decision_maker', e.target.value)}
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
                          onChange={(e) => updateBusinessField(biz.id, 'disposition', e.target.value, true)}
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

                    {/* Outreach Notes */}
                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-cyan-400" /> Outreach Notes
                      </label>
                      <textarea
                        rows={2}
                        value={biz.notes || ''}
                        onChange={(e) => updateBusinessField(biz.id, 'notes', e.target.value)}
                        placeholder="Log conversation, objections, callback time, or email..."
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Auto-Save Status & Web */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    {statusState === 'typing' && (
                      <span className="text-slate-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" /> Auto-saving...
                      </span>
                    )}
                    {statusState === 'saving' && (
                      <span className="text-cyan-400 flex items-center gap-1 font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                      </span>
                    )}
                    {statusState === 'saved' && (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <Check className="w-3.5 h-3.5" /> Saved
                      </span>
                    )}
                    {statusState === 'error' && (
                      <span className="text-rose-400 font-medium">Error saving</span>
                    )}
                    {!statusState && (
                      <span className="text-slate-600 text-[11px]">Auto-saves on typing</span>
                    )}
                  </div>

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