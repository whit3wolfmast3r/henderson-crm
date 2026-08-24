'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search, Globe, Phone, Star, MapPin, Mail,
  UserCheck, ExternalLink, Check, Copy, FileText, SearchCheck, 
  Loader2, Sparkles, X, Image as ImageIcon, Calendar, Video, CreditCard, IdCard
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

const FLYER_SAMPLES = [
  { 
    id: 'standard', 
    label: 'Standard ($199)', 
    file: 'standard.jpg',
    price: '$199',
    stripeUrl: 'https://buy.stripe.com/28o3cu7iGap951K7ss',
    btnText: 'Buy $199 Standard'
  },
  { 
    id: 'large', 
    label: 'Large Spotlight ($349)', 
    file: 'large.jpg',
    price: '$349',
    stripeUrl: 'https://buy.stripe.com/dR68wO0UigNxam49AB',
    btnText: 'Buy $349 Large'
  },
  { 
    id: 'jumbo', 
    label: 'Jumbo Half-Side ($599)', 
    file: 'jumbo.jpg',
    price: '$599',
    stripeUrl: 'https://buy.stripe.com/14k00i7iGbtd8dW4gi',
    btnText: 'Buy $599 Jumbo'
  },
  { 
    id: 'custom', 
    label: 'Full Custom', 
    file: 'custom.jpg',
    price: 'Custom Quote',
    stripeUrl: 'mailto:david@bldealz.com?subject=Custom%20Door%20Hanger%20Campaign%20Inquiry',
    btnText: 'Email for Custom Quote'
  },
  { 
    id: 'front', 
    label: 'Front Cover', 
    file: 'front.jpg',
    price: null,
    stripeUrl: null,
    btnText: null
  }
];

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

  // Modals
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [activeSample, setActiveSample] = useState(FLYER_SAMPLES[0]);

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

  const openOpenCorporates = (entityName) => {
    const clean = cleanEntityName(entityName);
    window.open(`https://opencorporates.com/companies/us_nv?q=${encodeURIComponent(clean)}`, '_blank');
  };

  const openBizapedia = (entityName) => {
    const clean = cleanEntityName(entityName);
    window.open(`https://www.bizapedia.com/search.aspx?company=${encodeURIComponent(clean)}`, '_blank');
  };

  const copyPhone = (e, id, phone) => {
    e.preventDefault();
    e.stopPropagation();
    const clean = phone.replace(/[^0-9]/g, '');
    navigator.clipboard.writeText(clean);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      {/* Header with Mobile-Optimized Action Bar */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center gap-4">
          <img 
            src="/BLD.png" 
            alt="Better Local Dealz" 
            className="h-12 w-auto object-contain rounded-lg p-1 bg-slate-900 border border-slate-800 shadow"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Henderson Outreach CRM
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">10,000 Door Hanger Campaign • Instant Officer Registries • Auto-Saving Leads</p>
          </div>
        </div>

        {/* Action Buttons: 2x2 Grid on Mobile, Flex on Desktop */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {/* Digital Business Card */}
          <button
            onClick={() => setShowCardModal(true)}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold px-3 py-2.5 rounded-lg shadow transition"
          >
            <IdCard className="w-4 h-4 text-cyan-400" /> David&apos;s Card
          </button>

          {/* Quick Pitch & Samples Modal */}
          <button
            onClick={() => setShowPitchModal(true)}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold px-3 py-2.5 rounded-lg shadow transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> Pitch & Samples
          </button>

          {/* Full Deck Page (Always Visible on Mobile) */}
          <Link
            href="/deck"
            target="_blank"
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-2.5 rounded-lg shadow transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" /> Deck & Pricing
          </Link>

          {/* Total Leads Badge */}
          <div className="flex items-center justify-center text-xs bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-lg text-slate-300">
            Leads: <span className="text-cyan-400 font-bold ml-1">{pagination.total.toLocaleString()}</span>
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
            const dialNumber = targetPhone.replace(/\D/g, '');
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

                  {/* Phone Display Bar with Click-To-Dial & Copy */}
                  <div className="mb-3 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                    {targetPhone ? (
                      <div className="flex items-center justify-between bg-slate-900 border border-slate-700/80 rounded-lg overflow-hidden group hover:border-cyan-500 transition-colors">
                        <a
                          href={`tel:${dialNumber}`}
                          title="Click to dial with RingCentral / Phone"
                          className="flex items-center gap-2 flex-1 px-3 py-1.5 text-cyan-300 font-mono font-bold text-sm hover:text-cyan-200 transition-colors overflow-hidden"
                        >
                          <Phone className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="truncate tracking-wide">{targetPhone}</span>
                        </a>

                        <button
                          type="button"
                          onClick={(e) => copyPhone(e, biz.id, targetPhone)}
                          title="Copy phone number"
                          className="px-2.5 py-2 text-slate-400 hover:text-white border-l border-slate-700/80 hover:bg-slate-800 transition-colors shrink-0"
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

      {/* Modal 1: Digital Business Card */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
            <div className="h-24 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 relative">
              <button
                onClick={() => setShowCardModal(false)}
                className="absolute top-3 right-3 p-1 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pb-6 pt-0 relative -mt-12 text-center">
              <img
                src="/david.png"
                alt="David"
                className="w-24 h-24 rounded-full border-4 border-slate-900 object-cover mx-auto shadow-xl"
              />
              <h3 className="text-xl font-bold text-white mt-3">David</h3>
              <p className="text-xs text-cyan-400 font-semibold">Campaign Director • Better Local Dealz</p>
              <p className="text-[11px] text-slate-400 mt-1">10,000 Door Hanger Residential Distributions</p>

              <div className="mt-5 space-y-2.5 text-left text-xs">
                <a
                  href="tel:7024259299"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 transition group"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Direct Line</p>
                      <p className="text-white font-mono font-bold">(702) 425-9299</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 font-bold px-2 py-1 rounded">Call / Text</span>
                </a>

                <a
                  href="mailto:david@bldealz.com"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 transition group"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Direct Email</p>
                      <p className="text-white font-bold">david@bldealz.com</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 font-bold px-2 py-1 rounded">Send Mail</span>
                </a>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <a
                  href="https://calendly.com/david-bldealz/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow"
                >
                  <Calendar className="w-3.5 h-3.5" /> Book Demo
                </a>
                <a
                  href="https://zoom.us/join"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow"
                >
                  <Video className="w-3.5 h-3.5" /> Join Zoom
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Sales Pitch, Samples & Direct Stripe Checkout */}
      {showPitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <img src="/BLD.png" alt="BLD" className="h-8 w-auto object-contain" />
                <h2 className="text-base font-bold text-white">Better Local Dealz • Outreach Kit & Direct Checkout</h2>
              </div>
              <button
                onClick={() => setShowPitchModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* David Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3.5">
                  <img
                    src="/david.png"
                    alt="David"
                    className="w-14 h-14 rounded-full border-2 border-cyan-400 object-cover shadow-lg shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">David • (702) 425-9299</h4>
                    <p className="text-xs text-cyan-400 font-medium">david@bldealz.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href="https://calendly.com/david-bldealz/demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-3.5 rounded-lg transition text-xs shadow"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Book Demo (Calendly)
                  </a>
                  <a
                    href="https://zoom.us/join"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3.5 rounded-lg transition text-xs shadow"
                  >
                    <Video className="w-3.5 h-3.5" /> Launch Zoom
                  </a>
                </div>
              </div>

              {/* Pitch Script Section */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Phone Outreach Script
                </h3>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p><strong className="text-amber-300">Hook:</strong> &quot;Hi [Owner], David here with Better Local Dealz. We&apos;re locking in category spots for our 10,000-home door-hanger drop hitting Henderson next month.&quot;</p>
                  <p><strong className="text-amber-300">Exclusivity:</strong> &quot;We only feature 1 business per category so you won&apos;t share space with any competitors. Full design, printing, and front-door delivery is covered.&quot;</p>
                  <p><strong className="text-amber-300">Call to Action:</strong> &quot;Can I email over the sample layout or do a quick 3-minute demo to lock in your industry slot before it fills?&quot;</p>
                </div>
              </div>

              {/* Scanned Image Viewer & Direct Stripe Payment Trigger */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" /> Scanned Samples & Instant Checkout
                  </h3>
                  
                  {/* Sample Tabs */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto">
                    {FLYER_SAMPLES.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => setActiveSample(sample)}
                        className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition ${
                          activeSample.id === sample.id
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scanned Sample Display + Buy Button */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[420px]">
                  <img
                    src={`/${activeSample.file}`}
                    alt={activeSample.label}
                    className="max-h-[480px] w-auto object-contain rounded-lg shadow-2xl border border-slate-800"
                  />

                  {activeSample.stripeUrl && (
                    <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                      <a
                        href={activeSample.stripeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg transition"
                      >
                        <CreditCard className="w-4 h-4" /> {activeSample.btnText}
                      </a>
                      <span className="text-[11px] text-slate-400">Guarantees slot lock for 10,000 homes</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}