'use client';
import { useState } from 'react';
import Link from 'next/link';
import { 
  PhoneCall, Calendar, Video, ArrowLeft, 
  CheckCircle2, Sparkles, Image as ImageIcon, ShieldCheck, 
  DollarSign, HelpCircle, CreditCard, Mail, Phone
} from 'lucide-react';

const PACKAGES = [
  {
    id: 'standard',
    name: 'Standard Ad Spot',
    price: '$199',
    tag: 'Most Popular for Local Services',
    reach: '10,000 Homes Guaranteed',
    stripeUrl: 'https://buy.stripe.com/28o3cu7iGap951K7ss',
    file: 'standard.jpg',
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
    stripeUrl: 'https://buy.stripe.com/dR68wO0UigNxam49AB',
    file: 'large.jpg',
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
    stripeUrl: 'https://buy.stripe.com/14k00i7iGbtd8dW4gi',
    file: 'jumbo.jpg',
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
    stripeUrl: 'mailto:david@bldealz.com?subject=Custom%20Door%20Hanger%20Inquiry',
    file: 'custom.jpg',
    features: [
      'Dedicated multi-panel takeover',
      'VIP front or back primary placement',
      'Ideal for contractors, roofers, HVAC & legal',
      'Complete turnaround with zero print markup'
    ]
  }
];

const TABS = [
  { id: 'standard', label: 'Standard ($199)', file: 'standard.jpg' },
  { id: 'large', label: 'Large Spotlight', file: 'large.jpg' },
  { id: 'jumbo', label: 'Jumbo Half-Side', file: 'jumbo.jpg' },
  { id: 'front', label: 'Front Cover', file: 'front.jpg' },
  { id: 'custom', label: 'Full Custom', file: 'custom.jpg' }
];

export default function SalesDeck() {
  const [selectedSample, setSelectedSample] = useState(TABS[0]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg transition border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" /> Back to Dialer
            </Link>
            <div className="h-5 w-px bg-slate-800 hidden sm:block" />
            <img src="/BLD.png" alt="BLD Logo" className="h-8 w-auto object-contain" />
            <h1 className="text-sm font-bold text-white hidden md:block">
              Better Local Dealz • Sales Deck & Direct Payment
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://calendly.com/david-bldealz/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition shadow"
            >
              <Calendar className="w-3.5 h-3.5" /> Book Demo (Calendly)
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
        
        {/* Digital Business Card + Value Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl items-center">
          
          {/* Representative Card */}
          <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <img
              src="/david.png"
              alt="David"
              className="w-16 h-16 rounded-full border-2 border-cyan-400 object-cover shadow-lg shrink-0"
            />
            <div>
              <h2 className="text-base font-bold text-white">David</h2>
              <p className="text-xs text-cyan-400 font-semibold">Campaign Director</p>
              <a href="tel:7024259299" className="text-xs text-slate-300 font-mono flex items-center gap-1 mt-1 hover:text-cyan-300">
                <Phone className="w-3 h-3 text-cyan-400" /> (702) 425-9299
              </a>
              <a href="mailto:david@bldealz.com" className="text-xs text-slate-400 flex items-center gap-1 hover:text-cyan-300">
                <Mail className="w-3 h-3 text-cyan-400" /> david@bldealz.com
              </a>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-2.5 py-1 rounded-md">
              Henderson 10,000 Door Hanger Drop
            </span>
            <h3 className="text-lg font-bold text-white">Physical Front-Door Placement with Category Exclusivity</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every package includes custom graphic design, full-color heavy cardstock printing, and GPS-verified distribution to 10,000 local homes. Zero competing businesses are accepted in your niche.
            </p>
          </div>
        </div>

        {/* Pricing Tiers with Stripe Checkout Buttons */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-cyan-400" /> Tier Packages & Instant Slot Booking
            </h3>
            <p className="text-xs text-slate-400">Click any button below to instantly secure and pay for your category slot via Stripe.</p>
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

                  <ul className="space-y-2 text-xs text-slate-300 mb-6">
                    {pkg.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <a
                    href={pkg.stripeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow"
                  >
                    <CreditCard className="w-4 h-4" /> Secure {pkg.name.split(' ')[0]} ({pkg.price})
                  </a>
                  <button
                    onClick={() => {
                      const tab = TABS.find(t => t.id === pkg.id);
                      if (tab) setSelectedSample(tab);
                    }}
                    className="w-full text-center text-xs text-slate-400 hover:text-white py-1 font-medium"
                  >
                    View Layout Sample ↓
                  </button>
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
                <ImageIcon className="w-5 h-5 text-cyan-400" /> Physical Flyer Print Proofs
              </h3>
              <p className="text-xs text-slate-400">Review exact layouts and dimensions on file.</p>
            </div>

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

          <div className="flex flex-col items-center justify-center bg-slate-950/80 p-4 rounded-xl border border-slate-800 min-h-[500px]">
            <img
              src={`/${selectedSample.file}`}
              alt={selectedSample.label}
              className="max-h-[680px] w-auto object-contain rounded-lg shadow-2xl border border-slate-800"
            />
          </div>
        </div>

      </main>
    </div>
  );
}