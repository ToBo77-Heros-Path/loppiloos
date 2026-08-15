'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MenuItem, CategoryType, CakeDetails } from '@/types/database';
import confetti from 'canvas-confetti';
import { ShoppingBag, Check, Plus, Minus, User, Sparkles, UtensilsCrossed, Wine, Cake, Trash2 } from 'lucide-react';

const PRESET_GUESTS = ['Tommy', 'Linda', 'Bella', 'Marley', 'Felicia', 'Kornelia', 'Annan'];

const DEFAULT_BASES = ['Sockerkaksbotten 🥞', 'Chokladbotten 🍫'];
const DEFAULT_FILLINGS = ['Jordgubbssylt 🍓', 'Vaniljkräm 🍦', 'Banan 🍌', 'Chokladmousse 🍫'];
const DEFAULT_TOPPINGS = [
  'Spritgrädde 🧁',
  'Jordgubbar & Bär 🍓',
  'Mini-Maränger 🍧',
  'Strössel 🍬',
  'Marshmallows 🍥',
  'Djungelvrål-kross 🍬',
];

interface CartItem {
  id: number | string;
  title: string;
  quantity: number;
  cake_details?: CakeDetails;
}

export default function GuestPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuest, setSelectedGuest] = useState<string>('Tommy');
  const [customGuest, setCustomGuest] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Smårätter');

  // Cake Builder State
  const [selectedBase, setSelectedBase] = useState<string>('');
  const [selectedFillings, setSelectedFillings] = useState<string[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [cakeAddedNotice, setCakeAddedNotice] = useState<boolean>(false);
  
  // Cart state: array of CartItem
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<{
    id: string;
    guestName: string;
    items: { title: string; quantity: number; cake_details?: CakeDetails }[];
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
        .select('*');

      if (error) {
        console.error('Error fetching menu items:', error);
        setMenuItems([]);
      } else {
        const list = ((data || []) as MenuItem[]).filter((i) => i.available !== false);
        setMenuItems(list);
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Cake options from Supabase or default fallbacks
  const dbBases = menuItems
    .filter((i) => i.category === 'Tårta - Botten' && i.available !== false)
    .map((i) => i.title);
  const baseOptions = dbBases.length > 0 ? dbBases : DEFAULT_BASES;

  const dbFillings = menuItems
    .filter((i) => i.category === 'Tårta - Fyllning' && i.available !== false)
    .map((i) => i.title);
  const fillingOptions = dbFillings.length > 0 ? dbFillings : DEFAULT_FILLINGS;

  const dbToppings = menuItems
    .filter((i) => i.category === 'Tårta - Topping' && i.available !== false)
    .map((i) => i.title);
  const toppingOptions = dbToppings.length > 0 ? dbToppings : DEFAULT_TOPPINGS;

  // Auto-select initial base
  useEffect(() => {
    if (!selectedBase && baseOptions.length > 0) {
      setSelectedBase(baseOptions[0]);
    }
  }, [baseOptions, selectedBase]);

  const handleToggleFilling = (filling: string) => {
    if (selectedFillings.includes(filling)) {
      setSelectedFillings((prev) => prev.filter((f) => f !== filling));
    } else {
      if (selectedFillings.length >= 3) {
        alert('Du kan välja maximalt 3 fyllningar!');
        return;
      }
      setSelectedFillings((prev) => [...prev, filling]);
    }
  };

  const handleToggleTopping = (topping: string) => {
    if (selectedToppings.includes(topping)) {
      setSelectedToppings((prev) => prev.filter((t) => t !== topping));
    } else {
      setSelectedToppings((prev) => [...prev, topping]);
    }
  };

  const handleAddCakeToCart = () => {
    if (!selectedBase) {
      alert('Vänligen välj en tårtbotten först!');
      return;
    }

    const cakeItem: CartItem = {
      id: `cake-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: 'Egendesignad Tårta 🎂',
      quantity: 1,
      cake_details: {
        base: selectedBase,
        fillings: selectedFillings,
        toppings: selectedToppings,
      },
    };

    setCart((prev) => [...prev, cakeItem]);
    setCakeAddedNotice(true);
    setTimeout(() => setCakeAddedNotice(false), 3000);

    // Reset filling/topping selections for next cake
    setSelectedFillings([]);
    setSelectedToppings([]);
  };

  const handleRemoveCartItem = (cartItemId: number | string) => {
    setCart((prev) => prev.filter((c) => c.id !== cartItemId));
  };

  const handleQuantityChange = (item: MenuItem, delta: number) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((c) => c.id === item.id);
      if (existingIndex > -1) {
        const nextQty = prevCart[existingIndex].quantity + delta;
        if (nextQty <= 0) {
          return prevCart.filter((c) => c.id !== item.id);
        }
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: nextQty,
        };
        return updated;
      } else if (delta > 0) {
        return [...prevCart, { id: item.id, title: item.title, quantity: delta }];
      }
      return prevCart;
    });
  };

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const activeGuestName = selectedGuest === 'Annan' && customGuest.trim() ? customGuest.trim() : selectedGuest;

  const handleSendOrder = async () => {
    if (cart.length === 0) {
      alert('Välj minst en rätt innan du skickar!');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    const itemsToSend = cart.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      ...(item.cake_details ? { cake_details: item.cake_details } : {}),
    }));

    try {
      const { data, error } = await supabase.from('orders').insert([
        {
          guest_name: activeGuestName,
          items: itemsToSend,
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

      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#F3A2BE', '#FFD3DD', '#81BFB7', '#C6E6E3', '#ffffff', '#e11d48'],
      });

      setLastOrderDetails({
        id: orderId,
        guestName: activeGuestName,
        items: itemsToSend,
      });

      setShowOrderModal(true);
      setCart([]);
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
    if (!i.category) return false;
    const cat = i.category.trim();
    return cat === selectedCategory;
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

        {/* 🎂 3-Step Guided Cake Builder for 'Bygg din Tårta' */}
        {selectedCategory === 'Bygg din Tårta' ? (
          <div className="flex flex-col gap-6 animate-curtain-reveal">
            {cakeAddedNotice && (
              <div className="bg-[#81BFB7] border-2 border-[#4F8881] text-white px-4 py-3 rounded-2xl text-center font-black text-sm shadow-md animate-bounce-gentle flex items-center justify-center gap-2">
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Din tårta har lagts till i varukorgen! 🎂</span>
              </div>
            )}

            {/* Banner */}
            <div className="bg-[#FFD3DD]/90 border-2 border-[#F3A2BE] rounded-2xl p-4 text-center text-xs sm:text-sm font-black text-[#2D3748] shadow-sm flex items-center justify-center gap-2">
              <span className="text-xl">🎂</span>
              <span>Bygg din drömtårta i 3 enkla steg!</span>
              <span className="text-xl">🎂</span>
            </div>

            {/* Steg 1: Välj Botten */}
            <div className="diner-glass-card rounded-3xl p-5 border-2 border-[#81BFB7]/40 shadow-diner-card space-y-3">
              <div className="flex items-center gap-2 text-[#2D3748] font-black text-base">
                <span className="bg-[#F3A2BE] text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm">1</span>
                <span>Steg 1: Välj Botten (Välj 1)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {baseOptions.map((base) => {
                  const isSelected = selectedBase === base;
                  return (
                    <button
                      key={base}
                      type="button"
                      onClick={() => setSelectedBase(base)}
                      className={`p-4 rounded-2xl text-left font-extrabold text-sm border-2 transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#F3A2BE] text-white border-[#e11d48] shadow-[0_0_12px_rgba(243,162,190,0.6)] scale-[1.02]'
                          : 'bg-white/90 text-[#2D3748] border-[#C6E6E3] hover:border-[#81BFB7]'
                      }`}
                    >
                      <span>{base}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-white bg-white' : 'border-[#81BFB7]'}`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Steg 2: Välj Fyllning */}
            <div className="diner-glass-card rounded-3xl p-5 border-2 border-[#81BFB7]/40 shadow-diner-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#2D3748] font-black text-base">
                  <span className="bg-[#F3A2BE] text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm">2</span>
                  <span>Steg 2: Välj Fyllning (Välj 1–3)</span>
                </div>
                <span className="text-xs font-bold text-[#4F8881] bg-[#F0F9F8] px-2.5 py-1 rounded-full border border-[#81BFB7]/30">
                  {selectedFillings.length}/3 valda
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fillingOptions.map((filling) => {
                  const isSelected = selectedFillings.includes(filling);
                  return (
                    <button
                      key={filling}
                      type="button"
                      onClick={() => handleToggleFilling(filling)}
                      className={`p-4 rounded-2xl text-left font-extrabold text-sm border-2 transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#FFD3DD] text-[#e11d48] border-[#F3A2BE] shadow-sm scale-[1.02]'
                          : 'bg-white/90 text-[#2D3748] border-[#C6E6E3] hover:border-[#81BFB7]'
                      }`}
                    >
                      <span>{filling}</span>
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center ${isSelected ? 'border-[#e11d48] bg-[#e11d48] text-white' : 'border-[#81BFB7]'}`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Steg 3: Välj Topping */}
            <div className="diner-glass-card rounded-3xl p-5 border-2 border-[#81BFB7]/40 shadow-diner-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#2D3748] font-black text-base">
                  <span className="bg-[#F3A2BE] text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm">3</span>
                  <span>Steg 3: Välj Topping (Valfritt antal)</span>
                </div>
                <span className="text-xs font-bold text-[#4F8881] bg-[#F0F9F8] px-2.5 py-1 rounded-full border border-[#81BFB7]/30">
                  {selectedToppings.length} valda
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {toppingOptions.map((topping) => {
                  const isSelected = selectedToppings.includes(topping);
                  return (
                    <button
                      key={topping}
                      type="button"
                      onClick={() => handleToggleTopping(topping)}
                      className={`p-4 rounded-2xl text-left font-extrabold text-sm border-2 transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#C6E6E3] text-[#4F8881] border-[#81BFB7] shadow-sm scale-[1.02]'
                          : 'bg-white/90 text-[#2D3748] border-[#C6E6E3] hover:border-[#81BFB7]'
                      }`}
                    >
                      <span>{topping}</span>
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center ${isSelected ? 'border-[#4F8881] bg-[#81BFB7] text-white' : 'border-[#81BFB7]'}`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Cake Button */}
            <button
              type="button"
              onClick={handleAddCakeToCart}
              disabled={!selectedBase}
              className="w-full bg-gradient-to-r from-[#F3A2BE] via-[#e11d48] to-[#F3A2BE] border-2 border-white text-white font-black py-4 px-6 rounded-3xl shadow-[0_0_20px_rgba(243,162,190,0.7)] hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Lägg till min Tårta i varukorgen 🎂</span>
            </button>

            {/* List custom cakes in cart */}
            {cart.some((c) => c.cake_details) && (
              <div className="diner-glass-card rounded-3xl p-5 border-2 border-[#F3A2BE] shadow-diner-card space-y-3">
                <h4 className="font-black text-sm text-[#2D3748] flex items-center gap-2">
                  <Cake className="w-4 h-4 text-[#F3A2BE]" />
                  Dina skapade tårtor i varukorgen:
                </h4>
                <div className="space-y-2">
                  {cart
                    .filter((c) => c.cake_details)
                    .map((c) => (
                      <div key={c.id} className="bg-white p-3.5 rounded-2xl border border-[#F3A2BE]/50 flex justify-between items-center text-xs shadow-sm">
                        <div className="space-y-1">
                          <div className="font-black text-[#e11d48] text-sm">{c.title}</div>
                          <div className="text-[#2D3748] font-medium leading-relaxed">
                            <div>🥞 <span className="font-bold">Botten:</span> {c.cake_details?.base}</div>
                            <div>🍓 <span className="font-bold">Fyllningar:</span> {c.cake_details?.fillings.length ? c.cake_details.fillings.join(', ') : 'Ingen'}</div>
                            <div>✨ <span className="font-bold">Toppings:</span> {c.cake_details?.toppings.length ? c.cake_details.toppings.join(', ') : 'Ingen'}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCartItem(c.id)}
                          className="p-2 text-[#e11d48] hover:bg-[#FFD3DD] rounded-xl transition-colors shrink-0 border border-[#F3A2BE]"
                          title="Ta bort tårta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 📜 Standard Menu List for other categories */
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
                const cartItem = cart.find((c) => c.id === item.id);
                const qty = cartItem ? cartItem.quantity : 0;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 min-h-[80px] w-full rounded-2xl bg-white/80 border transition-all duration-200 shadow-sm ${
                      qty > 0 ? 'border-[#F3A2BE] bg-[#FFD3DD]/30 shadow-[0_0_15px_rgba(243,162,190,0.3)]' : 'border-teal-100'
                    }`}
                  >
                    <div className="flex-1 pr-3 break-words">
                      <h3 className="font-extrabold text-base sm:text-lg text-[#2D3748] break-words">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-[#4A5568] mt-1 leading-relaxed break-words">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 bg-white/90 p-1.5 rounded-2xl border-2 border-[#81BFB7]/40 shadow-sm shrink-0">
                      {qty > 0 && (
                        <>
                          <button
                            onClick={() => handleQuantityChange(item, -1)}
                            className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-[#FFD3DD] text-[#e11d48] font-bold hover:bg-[#F3A2BE] hover:text-white transition-colors active:scale-95"
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
                        onClick={() => handleQuantityChange(item, 1)}
                        className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-[#F3A2BE] text-white font-bold hover:bg-[#e11d48] transition-all active:scale-95 shadow-md"
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
        )}
      </div>

      {/* 🚀 Flytande Beställningsknapp längst ned */}
      {totalItemCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 px-4 max-w-2xl mx-auto z-40 animate-bounce-gentle">
          <button
            onClick={handleSendOrder}
            disabled={isSubmitting || cart.length === 0}
            className="w-full bg-gradient-to-r from-[#F3A2BE] via-[#e11d48] to-[#F3A2BE] border-2 border-white text-white font-black py-4 px-6 rounded-3xl shadow-[0_0_20px_rgba(243,162,190,0.7)] hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-between text-base disabled:opacity-50 disabled:cursor-not-allowed"
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
              {lastOrderDetails.items.map((item: any, idx: number) => (
                <div key={idx} className="flex flex-col border-b border-[#81BFB7]/20 pb-1.5 text-[#2D3748] font-semibold last:border-0 last:pb-0">
                  <div className="flex justify-between">
                    <span className="truncate pr-2">{item.title}</span>
                    <span className="font-bold text-[#e11d48]">x{item.quantity}</span>
                  </div>
                  {item.cake_details && (
                    <div className="text-[11px] text-[#4F8881] font-medium mt-0.5">
                      🥞 {item.cake_details.base} | 🍓 {item.cake_details.fillings?.join(', ') || 'Ingen'} | ✨ {item.cake_details.toppings?.join(', ') || 'Ingen'}
                    </div>
                  )}
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
