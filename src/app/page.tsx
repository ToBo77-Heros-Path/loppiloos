'use me'; // client component
'use client';

import { useState, useEffect } from 'react';
import { supabase, DEFAULT_MENU_ITEMS, isSupabaseConfigured } from '@/lib/supabase';
import { MenuItem, CategoryType } from '@/types/database';
import confetti from 'canvas-confetti';
import { ShoppingBag, Check, Plus, Minus, User, Sparkles, UtensilsCrossed, Wine, IceCream, AlertCircle } from 'lucide-react';

const PRESET_GUESTS = ['Felicia', 'Tommy', 'Linda', 'Sara', 'Marcus', 'Annan'];

export default function GuestPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuest, setSelectedGuest] = useState<string>('Felicia');
  const [customGuest, setCustomGuest] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Smårätter');
  
  // Cart state: map of menuItem.id -> quantity
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<{
    id: string;
    guestName: string;
    items: { title: string; quantity: number; price: number }[];
    totalPrice: number;
  } | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Fetch menu items from Supabase
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    setLoading(true);
    if (!isSupabaseConfigured()) {
      console.log('Supabase not fully configured, using fallback menu items.');
      setMenuItems(DEFAULT_MENU_ITEMS.filter((i) => i.available));
      setUsingFallback(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        console.warn('Falling back to default items due to query:', error);
        setMenuItems(DEFAULT_MENU_ITEMS.filter((i) => i.available));
        setUsingFallback(true);
      } else {
        setMenuItems(data as MenuItem[]);
        setUsingFallback(false);
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setMenuItems(DEFAULT_MENU_ITEMS.filter((i) => i.available));
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (id: string, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const totalItemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const activeGuestName = selectedGuest === 'Annan' && customGuest.trim() ? customGuest.trim() : selectedGuest;

  const handleSendOrder = async () => {
    if (totalItemCount === 0 || isSubmitting) return;

    setIsSubmitting(true);

    // Prepare items array
    const orderedItems = Object.entries(cart)
      .map(([id, quantity]) => {
        const item = menuItems.find((m) => m.id === id);
        if (!item) return null;
        return {
          id: item.id,
          title: item.title,
          quantity,
          price: item.price,
          category: item.category,
        };
      })
      .filter(Boolean) as { id: string; title: string; quantity: number; price: number; category: CategoryType }[];

    const totalPrice = orderedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    const mockOrderId = `LOP-${Math.floor(1000 + Math.random() * 9000)}`;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('orders').insert([
          {
            guest_name: activeGuestName,
            items: orderedItems,
            status: 'Inkommen',
          },
        ]).select();

        if (error) {
          console.error('Supabase order insert error:', error);
        } else if (data && data[0]) {
          console.log('Order created successfully:', data[0]);
        }
      } catch (err) {
        console.error('Failed sending order to Supabase:', err);
      }
    }

    // Trigger Festive Confetti Pop-up!
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#881337', '#e11d48', '#ffffff'],
    });

    setLastOrderDetails({
      id: mockOrderId,
      guestName: activeGuestName,
      items: orderedItems,
      totalPrice,
    });

    setShowOrderModal(true);
    setCart({}); // Reset cart
    setIsSubmitting(false);
  };

  const categories: { key: CategoryType; label: string; icon: React.ReactNode }[] = [
    { key: 'Smårätter', label: 'Smårätter', icon: <UtensilsCrossed className="w-4 h-4" /> },
    { key: 'Candy Drinks', label: 'Candy Drinks', icon: <Wine className="w-4 h-4" /> },
    { key: 'Dessert', label: 'Dessert', icon: <IceCream className="w-4 h-4" /> },
  ];

  const filteredItems = menuItems.filter((i) => i.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* 🎪 Sleek Circus Header */}
      <header className="w-full circus-stripe-bg border-b-4 border-amber-500 text-center py-6 px-4 shadow-red-glow relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-black/40 pointer-events-none" />
        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" /> Welcome to Circus Loppiloo <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-amber-400 gold-text-glow font-serif">
            Loppiloo's 🎪
          </h1>
          <p className="text-rose-200 text-sm mt-1 font-medium italic">
            Små rätter, stora smaker & magiska drinkar!
          </p>
        </div>
      </header>

      {/* Fallback Notice if Supabase env vars not set */}
      {usingFallback && (
        <div className="w-full max-w-2xl px-4 mt-3">
          <div className="bg-amber-950/60 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Demoläge aktivt:</span> Supabase-miljövariabler saknas eller databasen har inte initierats. Kör <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">supabase-schema.sql</code> i Supabase SQL Editor för fullständig persistering!
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-2xl px-4 py-6 flex flex-col gap-6">
        {/* 👤 Gästval (Guest Selector) */}
        <section className="pinchos-glass-card rounded-2xl p-4 flex flex-col gap-3 border border-amber-500/30 shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <User className="w-4 h-4" />
            <span>Vem är det som beställer?</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_GUESTS.map((name) => {
              const isSelected = selectedGuest === name;
              return (
                <button
                  key={name}
                  onClick={() => setSelectedGuest(name)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-gold-glow scale-105'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-amber-500/50 hover:bg-slate-800'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {name}
                </button>
              );
            })}
          </div>

          {selectedGuest === 'Annan' && (
            <input
              type="text"
              placeholder="Skriv in ditt namn..."
              value={customGuest}
              onChange={(e) => setCustomGuest(e.target.value)}
              className="mt-1 w-full bg-slate-900 border border-amber-500/40 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          )}
        </section>

        {/* 🍽️ Kategori-flikar */}
        <section className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-amber-500/30 gap-1.5 shadow-md">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex-1 py-3 px-2 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-900 to-rose-950 text-amber-300 border border-amber-400/50 shadow-gold-glow'
                    : 'text-slate-400 hover:text-amber-200 hover:bg-slate-800/60'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </section>

        {/* 📜 Menylista (Menu List) */}
        <section className="flex flex-col gap-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Laddar cirkusmenyn...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 pinchos-glass-card rounded-2xl text-slate-400">
              Inga rätter tillgängliga i denna kategori för tillfället.
            </div>
          ) : (
            filteredItems.map((item) => {
              const qty = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className={`pinchos-glass-card rounded-2xl p-4 flex justify-between items-center transition-all duration-200 border ${
                    qty > 0 ? 'border-amber-400 bg-slate-900/90 shadow-gold-glow' : 'border-amber-500/20'
                  }`}
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-100 group-hover:text-amber-300">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                    <div className="mt-2 text-amber-400 font-extrabold text-sm flex items-center gap-1">
                      <span>{item.price} SEK</span>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-amber-500/30">
                    {qty > 0 && (
                      <>
                        <button
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="w-8 h-8 rounded-lg bg-rose-900/80 text-amber-300 hover:bg-rose-800 flex items-center justify-center transition-colors active:scale-95"
                          aria-label="Minska"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-extrabold text-amber-400 text-sm">
                          {qty}
                        </span>
                      </>
                    )}
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 flex items-center justify-center transition-all active:scale-95 shadow-md"
                      aria-label="Öka"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>

      {/* 🚀 Flytande Beställningsknapp längst ned */}
      {totalItemCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 px-4 max-w-2xl mx-auto z-40 animate-bounce-gentle">
          <button
            onClick={handleSendOrder}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-rose-900 via-rose-800 to-rose-900 border-2 border-amber-400 text-amber-300 font-extrabold py-4 px-6 rounded-2xl shadow-gold-glow hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-between text-base"
          >
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 text-slate-950 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-md">
                {totalItemCount}
              </div>
              <span className="gold-text-glow">Skicka beställning till köket</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-black/40 px-2.5 py-1 rounded-lg border border-amber-500/40 text-amber-300">
                Gäst: {activeGuestName}
              </span>
              <ShoppingBag className="w-5 h-5 text-amber-400" />
            </div>
          </button>
        </div>
      )}

      {/* 🥳 Festlig Bekräftelse Pop-Up Modal */}
      {showOrderModal && lastOrderDetails && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-curtain-reveal">
          <div className="pinchos-glass-card border-2 border-amber-400 rounded-3xl p-6 max-w-md w-full text-center relative shadow-gold-glow flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg border-2 border-amber-300 text-3xl">
              🎪
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                Order Mottagen!
              </span>
              <h2 className="text-2xl font-black text-slate-100">
                Tack {lastOrderDetails.guestName}!
              </h2>
              <p className="text-xs text-rose-300">
                Din beställning skickades direkt till köket på Loppiloo's.
              </p>
            </div>

            {/* Order Items List */}
            <div className="w-full bg-slate-950/80 rounded-2xl p-4 border border-amber-500/20 max-h-48 overflow-y-auto text-left text-xs space-y-2">
              <div className="flex justify-between font-bold text-amber-400 pb-1 border-b border-amber-500/20">
                <span>Rätt</span>
                <span>Antal</span>
              </div>
              {lastOrderDetails.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-slate-200">
                  <span className="truncate pr-2">{item.title}</span>
                  <span className="font-bold text-amber-300">x{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="w-full flex justify-between items-center bg-rose-950/50 border border-amber-500/30 rounded-xl px-4 py-2 text-xs">
              <span className="text-slate-400">Ordernummer:</span>
              <span className="font-mono font-bold text-amber-300">{lastOrderDetails.id}</span>
            </div>

            <button
              onClick={() => setShowOrderModal(false)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl shadow-md transition-all active:scale-95 text-sm uppercase tracking-wide"
            >
              Fortsätt Beställa ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
