import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Loppiloo's 🎪 | Pinchos-beställningar",
  description: "Exklusiv Pinchos-beställningsapp för mat & drinkar på Loppiloo's",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className="dark">
      <body className={`${outfit.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col`}>
        {/* Top Mini Navigation Bar for quick switching between views */}
        <nav className="bg-slate-900/90 border-b border-amber-500/20 px-4 py-2 text-xs flex justify-between items-center z-50 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Loppiloo's Live Menu</span>
          </div>
          <div className="flex gap-4 font-medium">
            <Link href="/" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              🎪 Gästvy
            </Link>
            <Link href="/kok" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              👨‍🍳 Köksskärm
            </Link>
            <Link href="/admin" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              ⚙️ Admin
            </Link>
          </div>
        </nav>

        <main className="flex-1 pb-24">
          {children}
        </main>
      </body>
    </html>
  );
}
