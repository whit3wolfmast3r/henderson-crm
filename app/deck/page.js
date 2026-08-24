'use client';
import { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, PhoneCall, Calendar, Video, ArrowLeft, 
  CheckCircle2, Sparkles, Image as ImageIcon, ShieldCheck, 
  ExternalLink, Layers, DollarSign, HelpCircle
} from 'lucide-react';

const PACKAGES = [
  {
    id: 'standard',
    name: 'Standard Ad Spot',
    price: '$199',
    tag: 'Most Popular for Local Services',
    reach: '10,000 Homes Guaranteed',
    image: '/standard.png',
    fallback: '/standard.jpg',
    features: [
      'Featured in 10,000 Henderson home deliveries',
      'Category exclusivity (Only 1 per business niche)',
      'Custom coupon / QR code lead tracking',
      'Full color design & production included'
    ]
  },
  {
    id: 'large',
    name: 'Large Spotlight Ad',
    price: '$349',
    tag: 'Double Size Visibility',
    reach: '10,000 Homes Guaranteed',
    image: '/large.png',
    fallback: '/large.jpg',
    features: [
      '2x space of standard ad spot',
      'High contrast headline & phone number',
      'Multiple service bullet points & trust badges',
      'Guaranteed front-door hanger delivery'
    ]
  },
  {
    id: 'jumbo',
    name: 'Jumbo Half-Side Ad',
    price: '$599',
    tag: 'Maximum Brand Dominance',
    reach: '10,000 Homes Guaranteed',
    image: '/jumbo.png',
    fallback: '/jumbo.jpg',
    features: [
      'Dominates half the entire flyer panel',
      'Prime eye-level placement on hanger',
      'Exclusive category lock-out',
      'Includes digital PDF proof + lead analytics'
    ]
  },
  {
    id: 'custom',
    name: 'Full Custom Feature',
    price: '$999',
    tag: 'Complete Takeover',
    reach: '10,000 Homes Guaranteed',
    image: '/custom.png',
    fallback: '/custom.jpg',
    features: [
      'Dedicated multi-panel takeover',
      'VIP front or back primary placement',
      'Ideal for contractors, roofers, HVAC & legal',
      'Complete turnaround with zero print markup'
    ]
  }
];

const TABS = [
  { id: 'front', label: 'Front Cover', src: '/front.png', fallback: '/front.jpg' },
  { id: 'standard', label: 'Standard ($199)', src: '/standard.png', fallback: '/standard.jpg' },
  { id: 'large', label: 'Large Spotlight', src: '/large.png', fallback: '/large.jpg' },
  { id: 'jumbo', label: 'Jumbo Half-Side', src: '/jumbo.png', fallback: '/jumbo.jpg' },
  { id: 'custom', label: 'Full Custom', src: '/custom.png', fallback: '/custom.jpg' }
];

export default function SalesDeck() {
  const [selectedSample, setSelectedSample] = useState(TABS[1]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg transition border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" /> Back to Dialer
            </Link>
            <div className="h-5 w-px bg-slate-800 hidden sm:block" />
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="text-cyan-400 w-5 h-5" /> Better Local Dealz • Sales & Pricing Deck
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://calendly.com/david-bldealz/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition shadow"
            >
              <Calendar className="w-3.5 h-3.5" /> Book Zoom (Calendly)
            </a>
            <a
              href="https://zoom.us/join"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition shadow"
            >
              <Video className="w-3.5 h-3.5" /> Launch Zoom
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-8 space-y-10">
        
        {/* Pitch & Value Proposition Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <div className="lg:col-span-2 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-2.5 py-1 rounded-md">
              10,000 Door Hanger Distribution
            </span>
            <h2 className="text-xl font-bold text-white">Direct-to-Door Residential Marketing at Less Than 2¢ Per Home</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              We eliminate junk mail trash bins by hanging physical, heavy-cardstock deal flyers directly on 10,000 residential front doors across prime Henderson neighborhoods. <strong>Every business gets exclusive category rights</strong> — ensuring zero competitor ads on the same drop.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-2.5 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>1 Business Per Category Lock</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full Graphic Design Included</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>GPS Tracking on All Door Drops</span>
            </div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-cyan-400" /> Ad Packages & Tier Breakdown
            </h3>
            <p className="text-xs text-slate-400">Fixed rate pricing covering complete print, graphics, and 10k physical drops.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  pkg.id === 'standard' 
                    ? 'border-cyan-500 shadow-lg shadow-cyan-950/40 relative ring-1 ring-cyan-500/50' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {pkg.id === 'standard' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full">
                    Best Value
                  </span>
                )}
                <div>
                  <h4 className="text-base font-bold text-white">{pkg.name}</h4>
                  <p className="text-[11px] text-cyan-400 font-medium mt-0.5">{pkg.tag}</p>

                  <div className="my-4">
                    <span className="text-3xl font-black text-white">{pkg.price}</span>
                    <span className="text-xs text-slate-400"> / 10,000 drop</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-300">
                    {pkg.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const tab = TABS.find(t => t.id === pkg.id);
                      if (tab) setSelectedSample(tab);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> View Sample
                  </button>
                  <a
                    href="https://calendly.com/david-bldealz/30min"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    Reserve Slot
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Scanned Flyer Visualizer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-cyan-400" /> Scanned Door Hanger Samples
              </h3>
              <p className="text-xs text-slate-400">Click any tab below to review the physical scanned layouts with prospects.</p>
            </div>

            {/* Flyer Selector Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSample(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    selectedSample.id === tab.id
                      ? 'bg-cyan-500 text-slate-950 shadow font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Large Image Preview Container */}
          <div className="flex flex-col items-center justify-center bg-slate-950/80 p-4 rounded-xl border border-slate-800 min-h-[500px]">
            <img
              src={selectedSample.src}
              alt={selectedSample.label}
              className="max-h-[680px] w-auto object-contain rounded-lg shadow-2xl border border-slate-800 transition-all duration-200"
              onError={(e) => {
                // Try fallback format if initial .png/.jpg isn't matched
                if (!e.target.dataset.triedFallback) {
                  e.target.dataset.triedFallback = 'true';
                  e.target.src = selectedSample.fallback;
                }
              }}
            />
            <span className="text-[11px] text-slate-500 mt-3">
              Inspecting sample: <code className="text-cyan-400 font-mono">{selectedSample.src}</code>
            </span>
          </div>
        </div>

        {/* Cold Calling Objection & Pitch Cheat Sheet */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" /> Rep Phone Script & Quick Objections
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
              <strong className="text-cyan-400 uppercase tracking-wider block">Opening Hook</strong>
              <p className="text-slate-300 leading-relaxed">
                &quot;Hi [Owner], David here with Better Local Dealz. We&apos;re currently printing our 10,000-home door-hanger drop for Henderson next month. We only feature 1 business per category so you won&apos;t share space with any competitors. Are you taking on new residential clients in the area right now?&quot;
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
              <strong className="text-amber-300 uppercase tracking-wider block">Handling &quot;We do digital / Facebook ads&quot;</strong>
              <p className="text-slate-300 leading-relaxed">
                &quot;Digital is great, but ad fatigue and ad blockers are at all-time highs. A physical flyer directly on someone&apos;s door knob gets brought inside the kitchen. Plus, at $199 for 10,000 homes, your cost per impression is under 2 cents.&quot;
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}