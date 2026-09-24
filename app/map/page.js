'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Phone, MapPin, ChevronLeft, Loader2, MessageSquare, LayoutGrid, Table as TableIcon, Map as MapIcon } from 'lucide-react';

const HENDERSON_CENTER = { lat: 36.0395, lng: -114.9817 };

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 120px)',
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#090d16' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0284c7' }] },
  ],
};

export default function MapCRM() {
  const [businesses, setBusinesses] = useState([]);
  const [activeBiz, setActiveBiz] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState('All');
  const [loading, setLoading] = useState(true);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    async function loadMapData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/businesses?limit=250&assigned_to=${encodeURIComponent(selectedAssignee)}`);
        const data = await res.json();
        setBusinesses(data.businesses || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMapData();
  }, [selectedAssignee]);

  // Marker Pin Colors: Sky Blue for David, Purple for Zach, Emerald for Unassigned
  const getMarkerIcon = useCallback((assignedTo) => {
    let fillColor = '#10b981';
    if (assignedTo?.toLowerCase() === 'david') fillColor = '#0284c7';
    if (assignedTo?.toLowerCase() === 'zach') fillColor = '#a855f7';

    return {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
      fillColor: fillColor,
      fillOpacity: 1,
      strokeWeight: 1.5,
      strokeColor: '#ffffff',
      scale: 1.6,
      anchor: isLoaded && window.google?.maps?.Point ? new window.google.maps.Point(12, 22) : undefined,
    };
  }, [isLoaded]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white p-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Cards
          </Link>
          <span className="text-slate-700">|</span>
          <h1 className="text-base font-bold text-white">Territory Map View</h1>
          <span className="text-xs bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-400 font-mono">
            {businesses.length} Plotted
          </span>
        </div>

        {/* View Switcher & Rep Filter */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <Link href="/" className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded text-slate-400 hover:text-white">
              <LayoutGrid className="w-3.5 h-3.5" /> Cards
            </Link>
            <Link href="/table" className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded text-slate-400 hover:text-white">
              <TableIcon className="w-3.5 h-3.5" /> Spreadsheet
            </Link>
            <Link href="/map" className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded bg-cyan-600 text-white shadow">
              <MapIcon className="w-3.5 h-3.5" /> Map
            </Link>
          </div>

          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="All">All Territories</option>
            <option value="david">David (Blue)</option>
            <option value="zach">Zach (Purple)</option>
            <option value="unassigned">Unassigned (Green)</option>
          </select>
        </div>
      </div>

      {/* Map Display */}
      <div className="mt-3 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative">
        {(!isLoaded || loading) && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
            <p className="text-xs text-slate-400">Loading Henderson Territory Map...</p>
          </div>
        )}

        {loadError && (
          <div className="p-8 text-center text-rose-400 text-sm">
            Error loading Google Maps. Verify <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> is set in <code>.env.local</code>.
          </div>
        )}

        {isLoaded && (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={HENDERSON_CENTER}
            zoom={12}
            options={mapOptions}
          >
            {businesses.map((biz, idx) => {
              // Plot coordinates or fallback to deterministic Henderson coordinate offsets
              const seed = (biz.id ? String(biz.id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : idx);
              const lat = biz.latitude || (HENDERSON_CENTER.lat + (Math.sin(seed) * 0.045));
              const lng = biz.longitude || (HENDERSON_CENTER.lng + (Math.cos(seed) * 0.045));

              return (
                <MarkerF
                  key={biz.id || idx}
                  position={{ lat: parseFloat(lat), lng: parseFloat(lng) }}
                  icon={getMarkerIcon(biz.assigned_to)}
                  onClick={() => setActiveBiz({ ...biz, plottedLat: parseFloat(lat), plottedLng: parseFloat(lng) })}
                />
              );
            })}

            {activeBiz && (
              <InfoWindowF
                position={{
                  lat: activeBiz.plottedLat || HENDERSON_CENTER.lat,
                  lng: activeBiz.plottedLng || HENDERSON_CENTER.lng
                }}
                onCloseClick={() => setActiveBiz(null)}
              >
                <div className="p-2 text-slate-950 max-w-xs font-sans">
                  <h3 className="font-bold text-sm leading-snug">
                    {activeBiz.dba || activeBiz.entity_name}
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {activeBiz.formatted_address || activeBiz.address || 'Henderson, NV'}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                    {activeBiz.phone_number ? (
                      <>
                        <a
                          href={`tel:${activeBiz.phone_number.replace(/\D/g, '')}`}
                          className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> Call
                        </a>
                        <a
                          href={`sms:${activeBiz.phone_number.replace(/\D/g, '')}`}
                          className="px-2 py-1 bg-sky-600 text-white rounded text-[11px] font-bold flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" /> Text
                        </a>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400">No phone</span>
                    )}

                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 uppercase ml-auto">
                      {activeBiz.assigned_to || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        )}
      </div>
    </div>
  );
}