'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MenuItem, CategoryType } from '@/types/database';
import confetti from 'canvas-confetti';
import { ShoppingBag, Check, Plus, Minus, User, Sparkles, UtensilsCrossed, Wine, Cake } from 'lucide-react';

const PRESET_GUESTS = ['Tommy', 'Linda', 'Bella', 'Marley', 'Felicia', 'Kornelia', 'Annan'];

export default function GuestPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuest, setSelectedGuest] = useState<string>('Tommy');
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
  } | null>(null);

  // Fetch menu items from Supabase
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: true });

      if (error || !data) {
        if (error) console.error('Error fetching menu items:', error);
        setMenuItems([]);
      } else {
        setMenuItems(data as MenuItem[]);
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setMenuItems([]);
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
          price: item.price || 0,
          category: item.category,
        };
      })
      .filter(Boolean) as { id: string; title: string; quantity: number; price: number; category: CategoryType }[];

    try {
      const { data, error } = await supabase.from('orders').insert([
        {
          guest_name: activeGuestName,
          items: orderedItems,
          status: 'Inkommen',
        },
      ]).select();

      if (error) {
        console.error('Supabase Error:', error);
        alert('Kunde inte skicka beställning: ' + error.message);
        setIsSubmitting(false);
        return;
      }

      console.log('Order sparades i Supabase:', data);
      const insertedOrder = data && data[0] ? data[0] : null;
      const orderId = insertedOrder?.id || `LOP-${Math.floor(1000 + Math.random() * 9000)}`;

      // Trigger Festive Confetti Pop-up endast när error är null!
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#F3A2BE', '#FFD3DD', '#81BFB7', '#C6E6E3', '#ffffff', '#e11d48'],
      });

      setLastOrderDetails({
        id: orderId,
        guestName: activeGuestName,
        items: orderedItems,
      });

      setShowOrderModal(true);
      setCart({}); // Töm varukorgen endast vid success (error === null)
    } catch (err: any) {
      console.error('Exception caught sending order:', err);
      alert('Kunde inte skicka beställning: ' + (err?.message || 'Ett nätverksfel uppstod.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: { key: CategoryType; label: string; icon: React.ReactNode }[] = [
    { key: 'Smårätter', label: 'Smårätter', icon: <UtensilsCrossed className="w-4 h-4" /> },
    { key: 'Candy Drinks', label: 'Candy Drinks', icon: <Wine className="w-4 h-4" /> },
    { key: 'Bygg din Tårta', label: '🎂 Bygg din Tårta', icon: <Cake className="w-4 h-4" /> },
  ];

  const filteredItems = menuItems.filter((i) => {
    if (selectedCategory === 'Bygg din Tårta') {
      return i.category === 'Bygg din Tårta' || i.category === 'Dessert';
    }
    return i.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFD3DD] via-[#F0F9F8] to-[#C6E6E3] text-[#2D3748] flex flex-col items-center">
      {/* 🍦 50s American Diner Neon Sign Header */}
      <header className="w-full bg-gradient-to-r from-[#F3A2BE] via-[#FFD3DD] to-[#F3A2BE] border-b-4 border-[#81BFB7] text-center py-7 px-4 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.4)_0%,_transparent_70%)] pointer-events-none" />
        
        {/* Retro Diner Chrome Border Banner */}
        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-[#F0F9F8]/90 border border-[#81BFB7] text-[#4F8881] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-3 shadow-sm backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-[#F3A2BE]" /> 🍿 LOPPILOO'S PARTY DINER 🍿 <Sparkles className="w-4 h-4 text-[#F3A2BE]" />
          </div>
          
          {/* Neon Sign for Loppiloo's */}
          <div className="bg-[#1e293b]/90 px-8 py-3 rounded-2xl border-2 border-[#81BFB7] shadow-[0_0_20px_rgba(243,162,190,0.5)] my-1 animate-neon-flicker">
            <h1 className="text-4xl sm:text-5xl md:text-6xl diner-neon-text tracking-wider" style={{ textShadow: '0 0 10px #F3A2BE, 0 0 20px #F3A2BE, 0 0 30px #e11d48' }}>
              Loppiloo's
            </h1>
          </div>

          <p className="text-[#4F8881] text-xs sm:text-sm mt-2 font-black tracking-wide bg-[#F0F9F8]/90 px-4 py-1.5 rounded-full border border-[#81BFB7]/40 shadow-sm">
            🎉 Felicia 10 år! Plocka dina favoriter & beställ direkt i appen!
          </p>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-2xl px-4 py-6 flex flex-col gap-6">
        {/* 👤 Gästval (Guest Selector) */}
        <section className="diner-glass-card rounded-3xl p-5 flex flex-col gap-3.5 border-2 border-[#81BFB7]/40 shadow-diner-card">
          <div className="flex items-center gap-2 text-[#4F8881] font-bold text-sm">
            <User className="w-4.5 h-4.5 text-[#F3A2BE]" />
            <span>Vem är det som beställer? (Välj ditt namn)</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {PRESET_GUESTS.map((name) => {
              const isSelected = selectedGuest === name;
              return (
                <button
                  key={name}
                  onClick={() => setSelectedGuest(name)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-extrabold transition-all duration-200 flex items-center gap-1.5 border-2 ${
                    isSelected
                      ? 'bg-[#F3A2BE] text-white border-[#e11d48] shadow-[0_0_12px_rgba(243,162,190,0.6)] scale-105'
                      : 'bg-white/90 text-[#4F8881] border-[#C6E6E3] hover:border-[#81BFB7] hover:bg-[#F0F9F8]'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  {name}
                </button>
              );
            })}
          </div>

          {selectedGuest === 'Annan' && (
            <input
              type="text"
              placeholder="Skriv in ditt namn här..."
              value={customGuest}
              onChange={(e) => setCustomGuest(e.target.value)}
              className="mt-1 w-full bg-white border-2 border-[#F3A2BE] rounded-2xl px-4 py-3 text-sm text-[#2D3748] placeholder-[#81BFB7] focus:outline-none focus:ring-2 focus:ring-[#81BFB7]"
            />
          )}
        </section>

        {/* 🍽️ Kategori-flikar */}
        <section className="flex bg-[#F0F9F8] p-1.5 rounded-2xl border-2 border-[#81BFB7]/50 gap-1.5 shadow-md">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex-1 py-3 px-2 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 border ${
                  isActive
                    ? 'bg-[#81BFB7] text-white border-[#4F8881] shadow-md scale-[1.02]'
                    : 'text-[#4F8881] border-transparent hover:bg-[#C6E6E3]/50'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </section>

        {/* 🎂 Info-banner för 'Bygg din Tårta' */}
        {selectedCategory === 'Bygg din Tårta' && (
          <div className="bg-[#FFD3DD]/90 border-2 border-[#F3A2BE] rounded-2xl p-3.5 text-center text-xs sm:text-sm font-black text-[#2D3748] shadow-sm flex items-center justify-center gap-2 animate-curtain-reveal">
            <span className="text-lg">🎂</span>
            <span>Välj de tillbehör och toppings du vill ha till din tårtbotten!</span>
            <span className="text-lg">🎂</span>
          </div>
        )}

        {/* 📜 Menylista (Menu List) */}
        <section className="flex flex-col gap-4">
          {loading ? (
            <div className="text-center py-12 text-[#4F8881] flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-[#F3A2BE] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold">Laddar diner-menyn...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 diner-glass-card rounded-2xl text-[#4F8881] font-medium">
              {menuItems.length === 0 ? 'Inga rätter tillagda än. Lägg till rätter via Admin!' : 'Inga rätter tillgängliga i denna kategori för tillfället.'}
            </div>
          ) : (
            filteredItems.map((item) => {
              const qty = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className={`diner-glass-card rounded-3xl p-4.5 flex justify-between items-center transition-all duration-200 border-2 ${
                    qty > 0 ? 'border-[#F3A2BE] bg-[#FFD3DD]/30 shadow-[0_0_15px_rgba(243,162,190,0.3)]' : 'border-[#81BFB7]/30'
                  }`}
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base sm:text-lg text-[#2D3748]">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs text-[#4A5568] mt-1 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 bg-white/90 p-1.5 rounded-2xl border-2 border-[#81BFB7]/40 shadow-sm shrink-0">
                    {qty > 0 && (
                      <>
                        <button
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="w-8 h-8 rounded-xl bg-[#FFD3DD] text-[#e11d48] font-bold hover:bg-[#F3A2BE] hover:text-white flex items-center justify-center transition-colors active:scale-95"
                          aria-label="Minska"
                        >
                          <Minus className="w-4 h-4 stroke-[3]" />
                        </button>
                        <span className="w-6 text-center font-black text-[#2D3748] text-sm">
                          {qty}
                        </span>
                      </>
                    )}
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="w-8 h-8 rounded-xl bg-[#F3A2BE] text-white font-bold hover:bg-[#e11d48] flex items-center justify-center transition-all active:scale-95 shadow-md"
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
            className="w-full bg-gradient-to-r from-[#F3A2BE] via-[#e11d48] to-[#F3A2BE] border-2 border-white text-white font-black py-4 px-6 rounded-3xl shadow-[0_0_20px_rgba(243,162,190,0.7)] hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-between text-base"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white text-[#e11d48] w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-md">
                {totalItemCount}
              </div>
              <span className="tracking-wide">Skicka beställning till köket</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-black/20 px-3 py-1 rounded-full border border-white/40 text-white font-bold">
                Gäst: {activeGuestName}
              </span>
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
          </button>
        </div>
      )}

      {/* 🥳 Festlig Bekräftelse Pop-Up Modal */}
      {showOrderModal && lastOrderDetails && (
        <div className="fixed inset-0 bg-[#2D3748]/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-curtain-reveal">
          <div className="diner-glass-card border-4 border-[#F3A2BE] rounded-3xl p-6 max-w-md w-full text-center relative shadow-[0_0_30px_rgba(243,162,190,0.5)] flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#F3A2BE] to-[#81BFB7] flex items-center justify-center shadow-lg border-2 border-white text-3xl">
              🎉
            </div>

            <div className="space-y-1.5">
              <span className="text-xs uppercase tracking-widest text-[#F3A2BE] font-black bg-[#FFD3DD]/60 px-3 py-1 rounded-full border border-[#F3A2BE]/40">
                Order Mottagen!
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#2D3748]">
                Tack för din beställning!
              </h2>
              <p className="text-sm text-[#4F8881] font-bold">
                Köket har tagit emot din order.
              </p>
            </div>

            {/* Order Items List */}
            <div className="w-full bg-white/90 rounded-2xl p-4 border border-[#81BFB7]/40 max-h-48 overflow-y-auto text-left text-xs space-y-2">
              <div className="flex justify-between font-bold text-[#4F8881] pb-1 border-b border-[#81BFB7]/30">
                <span>Rätt (Gäst: {lastOrderDetails.guestName})</span>
                <span>Antal</span>
              </div>
              {lastOrderDetails.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[#2D3748] font-semibold">
                  <span className="truncate pr-2">{item.title}</span>
                  <span className="font-bold text-[#e11d48]">x{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="w-full flex justify-between items-center bg-[#FFD3DD]/60 border border-[#F3A2BE]/50 rounded-xl px-4 py-2 text-xs">
              <span className="text-[#4F8881] font-bold">Ordernummer:</span>
              <span className="font-mono font-black text-[#e11d48]">{lastOrderDetails.id}</span>
            </div>

            <button
              onClick={() => setShowOrderModal(false)}
              className="w-full bg-[#81BFB7] hover:bg-[#4F8881] text-white font-black py-3.5 rounded-2xl shadow-md transition-all active:scale-95 text-sm uppercase tracking-wide"
            >
              Fortsätt Beställa ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
