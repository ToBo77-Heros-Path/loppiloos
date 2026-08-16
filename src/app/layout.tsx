import type { Metadata } from 'next';
import { Outfit, Pacifico } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const outfit = Outfit({ subsets: ['latin'] });
const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pacifico',
});

export const metadata: Metadata = {
  title: "Loppiloo's 🍦 50's Diner | Pinchos-beställningar",
  description: "Exklusiv 50-tals Pastel Diner & Pinchos-beställningsapp för mat & drinkar på Loppiloo's",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className={`${outfit.className} ${pacifico.variable} min-h-screen flex flex-col`}>
        {/* Top Mini Navigation Bar for quick switching between views */}
        <nav className="bg-[#F0F9F8]/90 border-b border-[#81BFB7]/40 px-4 py-2.5 text-xs flex justify-between items-center z-50 text-[#4F8881] backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F3A2BE] animate-pulse shadow-[0_0_8px_#F3A2BE]"></span>
            <span className="font-bold tracking-wide text-[#2D3748]">Loppiloo's Diner Live</span>
          </div>
          <div className="flex gap-4 font-bold text-xs">
            <Link href="/" className="hover:text-[#e11d48] transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-[#FFD3DD]/50">
              🍦 Gästvy
            </Link>
            <Link href="/kok" className="hover:text-[#e11d48] transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-[#FFD3DD]/50">
              👨‍🍳 Köksvy
            </Link>
            <Link href="/admin" className="hover:text-[#e11d48] transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-[#FFD3DD]/50">
              ⚙️ Admin
            </Link>
            <Link href="/statistik" className="hover:text-[#e11d48] transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-[#FFD3DD]/50">
              📊 Statistik
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
