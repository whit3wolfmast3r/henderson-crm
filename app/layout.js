import './globals.css';

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
