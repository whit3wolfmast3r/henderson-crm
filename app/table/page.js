'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search, Phone, MessageSquare, ExternalLink, 
  Check, Copy, Loader2, ChevronLeft, LayoutGrid, Table as TableIcon, Map as MapIcon, User
} from 'lucide-react';

const DISPOSITIONS = [
  'All',
  'Not Contacted',
  'Interested',
  'Callback',
  'Text Later',
  'Left Voicemail',
  'Gatekeeper',
  'Not Interested',
  'Do Not Call'
];

const DISPOSITION_BADGES = {
  'Not Contacted': 'bg-slate-800 text-slate-300 border-slate-700',
  'Interested': 'bg-emerald-950/80 text-emerald-400 border-emerald-700',
  'Callback': 'bg-amber-950/80 text-amber-300 border-amber-700',
  'Text Later': 'bg-sky-950/80 text-sky-300 border-sky-700',
  'Left Voicemail': 'bg-sky-950/80 text-sky-300 border-sky-700',
  'Gatekeeper': 'bg-purple-950/80 text-purple-300 border-purple-700',
  'Not Interested': 'bg-rose-950/80 text-rose-400 border-rose-800',
  'Do Not Call': 'bg-red-950 text-red-500 border-red-900',
};

export default function SpreadsheetCRM() {
  const [businesses, setBusinesses] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDisp, setSelectedDisp] = useState('All');
  const [selectedAssignee, setSelectedAssignee] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [savedStatus, setSavedStatus] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const saveTimers = useRef({});

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/businesses?q=${encodeURIComponent(search)}&disposition=${encodeURIComponent(selectedDisp)}&assigned_to=${encodeURIComponent(selectedAssignee)}&page=${page}`
      );
      const data = await res.json();
      setBusinesses(data.businesses || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [selectedDisp, selectedAssignee, page]);

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
          decision_maker: bizPayload.decision_maker,
          assigned_to: bizPayload.assigned_to || 'unassigned',
          last_called_at: bizPayload.last_called_at || null
        })
      });
      setSavedStatus(prev => ({ ...prev, [bizPayload.id]: 'saved' }));
      setTimeout(() => {
        setSavedStatus(prev => ({ ...prev, [bizPayload.id]: null }));
      }, 1500);
    } catch (e) {
      console.error(e);
      setSavedStatus(prev => ({ ...prev, [bizPayload.id]: 'error' }));
    }
  };

  const queueAutoSave = useCallback((updatedBiz, delay = 600) => {
    const id = updatedBiz.id;
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    setSavedStatus(prev => ({ ...prev, [id]: 'typing' }));
    saveTimers.current[id] = setTimeout(() => persistToApi(updatedBiz), delay);
  }, []);

  const updateField = (id, field, value, instant = false) => {
    setBusinesses(prev => {
      let targetBiz = null;
      const updated = prev.map(b => {
        if (b.id === id) {
          targetBiz = { 
            ...b, 
            [field]: value,
            ...(field === 'disposition' ? { last_called_at: new Date().toISOString() } : {})
          };
          return targetBiz;
        }
        return b;
      });
      if (targetBiz) queueAutoSave(targetBiz, instant ? 40 : 600);
      return updated;
    });
  };

  const copyPhone = (id, phone) => {
    navigator.clipboard.writeText(phone.replace(/[^0-9]/g, ''));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white p-4 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Cards
          </Link>
          <span className="text-slate-700">|</span>
          <h1 className="text-base font-bold text-white tracking-tight">Data Grid / Spreadsheet</h1>
          <span className="text-xs bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded text-cyan-400 font-mono">
            {pagination.total.toLocaleString()} leads
          </span>
        </div>

        {/* View Switcher */}
        <div className="inline-flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          <Link href="/" className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded text-slate-400 hover:text-white">
            <LayoutGrid className="w-3.5 h-3.5" /> Cards
          </Link>
          <Link href="/table" className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded bg-cyan-600 text-white shadow">
            <TableIcon className="w-3.5 h-3.5" /> Spreadsheet
          </Link>
          <Link href="/map" className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded text-slate-400 hover:text-white">
            <MapIcon className="w-3.5 h-3.5" /> Map
          </Link>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 my-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search business, phone, owner, address..."
            className="w-full pl-9 pr-20 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-[11px] font-semibold"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <select
            value={selectedAssignee}
            onChange={(e) => { setSelectedAssignee(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="All">All Reps</option>
            <option value="david">David's Leads</option>
            <option value="zach">Zach's Leads</option>
            <option value="unassigned">Unassigned</option>
          </select>

          <select
            value={selectedDisp}
            onChange={(e) => { setSelectedDisp(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            {DISPOSITIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Spreadsheet Container */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10 select-none">
              <tr>
                <th className="p-3 w-14 text-center">Rep</th>
                <th className="p-3 w-64">Business / Trade Name</th>
                <th className="p-3 w-48">Phone & Actions</th>
                <th className="p-3 w-44">Disposition</th>
                <th className="p-3 w-40">Decision Maker</th>
                <th className="p-3 min-w-[280px]">Call Notes</th>
                <th className="p-3 w-48">Location</th>
                <th className="p-3 w-16 text-center">Save</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                    Loading records...
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    No businesses found matching query.
                  </td>
                </tr>
              ) : (
                businesses.map((biz) => {
                  const phone = biz.phone_number || biz.municipal_phone || '';
                  const dialNumber = phone.replace(/\D/g, '');
                  const status = savedStatus[biz.id];

                  return (
                    <tr 
                      key={biz.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        biz.assigned_to === 'david' ? 'bg-sky-950/20' : biz.assigned_to === 'zach' ? 'bg-purple-950/20' : ''
                      }`}
                    >
                      {/* Rep Toggle Buttons */}
                      <td className="p-2 text-center">
                        <div className="inline-flex rounded border border-slate-800 bg-slate-950 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateField(biz.id, 'assigned_to', biz.assigned_to === 'david' ? 'unassigned' : 'david', true)}
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${
                              biz.assigned_to === 'david' ? 'bg-sky-600 text-white' : 'text-slate-500 hover:text-white'
                            }`}
                          >
                            D
                          </button>
                          <button
                            type="button"
                            onClick={() => updateField(biz.id, 'assigned_to', biz.assigned_to === 'zach' ? 'unassigned' : 'zach', true)}
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${
                              biz.assigned_to === 'zach' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-white'
                            }`}
                          >
                            Z
                          </button>
                        </div>
                      </td>

                      {/* Business Name */}
                      <td className="p-3">
                        <div className="font-bold text-white truncate max-w-[240px]">
                          {biz.dba || biz.entity_name}
                        </div>
                        {biz.entity_name && biz.entity_name !== biz.dba && (
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[240px]">
                            {biz.entity_name}
                          </div>
                        )}
                      </td>

                      {/* Phone & Direct Dial/Text */}
                      <td className="p-2">
                        {phone ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${dialNumber}`}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono rounded font-bold flex items-center gap-1 text-[11px]"
                            >
                              <Phone className="w-3 h-3 text-cyan-400" /> {phone}
                            </a>
                            <a
                              href={`sms:${dialNumber}`}
                              className="p-1 text-sky-400 hover:bg-slate-800 rounded"
                              title="Text Business"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => copyPhone(biz.id, phone)}
                              className="p-1 text-slate-400 hover:text-white rounded"
                            >
                              {copiedId === biz.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[11px]">No phone</span>
                        )}
                      </td>

                      {/* Disposition Dropdown */}
                      <td className="p-2">
                        <select
                          value={biz.disposition || 'Not Contacted'}
                          onChange={(e) => updateField(biz.id, 'disposition', e.target.value, true)}
                          className={`w-full text-xs font-semibold py-1 px-2 rounded border focus:outline-none ${
                            DISPOSITION_BADGES[biz.disposition] || 'bg-slate-900 border-slate-800 text-white'
                          }`}
                        >
                          {DISPOSITIONS.filter(d => d !== 'All').map(d => (
                            <option key={d} value={d} className="bg-slate-900 text-white">
                              {d}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Decision Maker Input */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={biz.decision_maker || ''}
                          onChange={(e) => updateField(biz.id, 'decision_maker', e.target.value)}
                          placeholder="Owner / GM..."
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </td>

                      {/* Inline Outreach Notes */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={biz.notes || ''}
                          onChange={(e) => updateField(biz.id, 'notes', e.target.value)}
                          placeholder="Log notes, objections, timing..."
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                        />
                      </td>

                      {/* Address */}
                      <td className="p-3 text-slate-400 truncate max-w-[180px]">
                        {biz.formatted_address || biz.address || `${biz.city || ''}, ${biz.state || ''}`}
                      </td>

                      {/* Auto-Save Indicator */}
                      <td className="p-2 text-center">
                        {status === 'saving' && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin mx-auto" />}
                        {status === 'saved' && <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" />}
                        {status === 'typing' && <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />}
                        {!status && <span className="text-[10px] text-slate-600 font-mono">OK</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Page <strong className="text-white">{page}</strong> of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-slate-900 border border-slate-800 rounded disabled:opacity-40 hover:bg-slate-800"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1 bg-slate-900 border border-slate-800 rounded disabled:opacity-40 hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}