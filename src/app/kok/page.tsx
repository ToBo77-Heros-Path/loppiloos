'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Order, MenuItem, CategoryType } from '@/types/database';
import { BellRing, CheckCircle2, Clock, Volume2, RefreshCw, ChefHat, Plus, Trash2, Check, X, Utensils, Settings } from 'lucide-react';
import Link from 'next/link';

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [activeTab, setActiveTab] = useState<'Inkommen' | 'Klar' | 'Meny'>('Inkommen');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastNotificationTime, setLastNotificationTime] = useState<string | null>(null);

  // Form state for menu manager in kitchen
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryType>('Smårätter');
  const [newAvailable, setNewAvailable] = useState(true);
  const [isAddingDish, setIsAddingDish] = useState(false);

  // Web Audio chime generator for "pling"
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playPlingSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // 1046.5Hz (C6) and 1318.5Hz (E6)
      osc1.frequency.setValueAtTime(1046.5, now);
      osc2.frequency.setValueAtTime(1318.5, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.08);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  };

  // 1. Fetch existing orders & menu items upon mounting + setup Realtime subskription
  useEffect(() => {
    fetchOrders();
    fetchMenuItems();

    // Realtime subscription on 'schema-db-changes' channel
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Realtime change:', payload);
          if (payload.eventType === 'INSERT' && soundEnabled) {
            playPlingSound();
            setLastNotificationTime(new Date().toLocaleTimeString('sv-SE'));
          }
          fetchOrders();
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled]);

  // Förenklad Supabase-fråga: Hämtar ALLA rader oavsett status och loggar till konsolen
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Hämtade orders:', data);

      if (error) {
        console.error('Error fetching orders from Supabase:', error);
        setOrders([]);
      } else {
        setOrders(data as Order[] || []);
      }
    } catch (err) {
      console.error('Failed fetching kitchen orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchMenuItems = async () => {
    setLoadingMenu(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Failed fetching menu items in kitchen:', error);
        setMenuItems([]);
      } else if (data) {
        setMenuItems(data as MenuItem[]);
      }
    } catch (err) {
      console.error('Failed fetching menu items in kitchen:', err);
      setMenuItems([]);
    } finally {
      setLoadingMenu(false);
    }
  };

  // Status-uppdatering: Omedelbar lokal uppdatering + Supabase update
  const handleMarkAsDone = async (orderId: string) => {
    // Omedelbart lokalt state utan reflash
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Klar' as const } : o))
    );

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Klar' })
        .eq('id', orderId);

      if (error) {
        console.error('Failed updating order status in Supabase:', error);
      } else {
        console.log(`Order ${orderId} markerad som Klar i Supabase.`);
      }
    } catch (err) {
      console.error('Failed updating order status in Supabase:', err);
    }
  };

  // Kitchen Menu Management Handlers
  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsAddingDish(true);
    const { data, error } = await supabase.from('menu_items').insert([
      {
        title: newTitle.trim(),
        category: newCategory,
        description: newDescription.trim(),
        available: newAvailable,
      }
    ]).select();

    if (error) {
      alert('Kunde inte spara rätt i databasen: ' + error.message);
    } else {
      fetchMenuItems();
    }

    setNewTitle('');
    setNewDescription('');
    setNewAvailable(true);
    setIsAddingDish(false);
  };

  const handleToggleAvailable = async (id: string, currentAvailable: boolean) => {
    const nextAvailable = !currentAvailable;
    setMenuItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, available: nextAvailable } : i))
    );

    try {
      await supabase
        .from('menu_items')
        .update({ available: nextAvailable })
        .eq('id', id);
    } catch (err) {
      console.error('Failed toggling availability in Supabase:', err);
    }
  };

  const handleDeleteDish = async (itemId: string) => {
    if (!confirm('Vill du ta bort denna rätt permanent från menyn?')) return;

    const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
    if (error) {
      alert('Kunde inte ta bort i Supabase: ' + error.message);
    } else {
      fetchMenuItems();
    }
  };

  // Case-insensitive status matching function ('Inkommen' vs 'inkommen', 'Klar' vs 'klar')
  const isStatusMatch = (orderStatus?: string, targetTab?: 'Inkommen' | 'Klar') => {
    if (!targetTab) return true;
    const s = (orderStatus || '').trim().toLowerCase();
    const t = targetTab.trim().toLowerCase();
    if (t === 'inkommen') {
      return s === 'inkommen' || s === 'new' || s === 'pending' || s === '';
    }
    if (t === 'klar') {
      return s === 'klar' || s === 'completed' || s === 'done';
    }
    return s === t;
  };

  const filteredOrders = orders.filter((o) => isStatusMatch(o.status, activeTab as 'Inkommen' | 'Klar'));
  const activeCount = orders.filter((o) => isStatusMatch(o.status, 'Inkommen')).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFD3DD] via-[#F0F9F8] to-[#C6E6E3] text-[#2D3748] flex flex-col">
      {/* 👨‍🍳 Kitchen 50s Diner Header */}
      <header className="bg-gradient-to-r from-[#F3A2BE] via-[#FFD3DD] to-[#F3A2BE] border-b-4 border-[#81BFB7] p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#1e293b] px-5 py-2 rounded-2xl border-2 border-[#81BFB7] shadow-[0_0_15px_rgba(243,162,190,0.6)] animate-neon-flicker">
            <h1 className="text-2xl sm:text-3xl diner-neon-text tracking-wide" style={{ textShadow: '0 0 10px #F3A2BE, 0 0 20px #F3A2BE, 0 0 30px #e11d48' }}>
              Loppiloo's Köksvy
            </h1>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs text-[#4F8881] font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#81BFB7] animate-ping" />
              🍿 LOPPILOO'S PARTY DINER 🍿
              {lastNotificationTime && ` • Senaste pling: ${lastNotificationTime}`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              playPlingSound();
              setSoundEnabled(!soundEnabled);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2 ${
              soundEnabled
                ? 'bg-white text-[#e11d48] border-[#F3A2BE] shadow-sm'
                : 'bg-[#F0F9F8] text-[#81BFB7] border-[#C6E6E3]'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{soundEnabled ? 'Ljud På' : 'Ljud Av'}</span>
          </button>

          {/* Manuell 'Ladda om'-knapp */}
          <button
            onClick={() => {
              fetchOrders();
              fetchMenuItems();
            }}
            className="px-4 py-2 bg-white hover:bg-[#F0F9F8] rounded-xl border-2 border-[#81BFB7] text-[#4F8881] font-extrabold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95"
            title="Ladda om alla orders manuellt från Supabase"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Ladda om orders</span>
          </button>

          <Link
            href="/admin"
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-[#81BFB7] hover:bg-[#4F8881] text-white border-2 border-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Admin-sida</span>
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between border-b-2 border-[#81BFB7]/40 pb-3 gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('Inkommen')}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 border-2 transition-all ${
                activeTab === 'Inkommen'
                  ? 'bg-[#F3A2BE] text-white border-[#e11d48] shadow-[0_0_12px_rgba(243,162,190,0.6)]'
                  : 'bg-white/80 text-[#4F8881] border-[#C6E6E3] hover:bg-[#F0F9F8]'
              }`}
            >
              <BellRing className="w-4 h-4 stroke-[2.5]" />
              <span>Inkomna Beställningar</span>
              {activeCount > 0 && (
                <span className="bg-[#e11d48] text-white px-2 py-0.5 rounded-full text-xs font-black shadow-sm">
                  {activeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('Klar')}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 border-2 transition-all ${
                activeTab === 'Klar'
                  ? 'bg-[#81BFB7] text-white border-[#4F8881] shadow-md'
                  : 'bg-white/80 text-[#4F8881] border-[#C6E6E3] hover:bg-[#F0F9F8]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Färdiga (Klara)</span>
            </button>

            <button
              onClick={() => setActiveTab('Meny')}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 border-2 transition-all ${
                activeTab === 'Meny'
                  ? 'bg-[#e11d48] text-white border-white shadow-[0_0_12px_rgba(225,29,72,0.4)]'
                  : 'bg-white/80 text-[#4F8881] border-[#C6E6E3] hover:bg-[#F0F9F8]'
              }`}
            >
              <Utensils className="w-4 h-4 stroke-[2.5]" />
              <span>Menyhantering ({menuItems.length} rätter)</span>
            </button>
          </div>
        </div>

        {/* --- VIEW 1 & 2: ORDERS (INKOMNA / KLARA) --- */}
        {activeTab !== 'Meny' && (
          <>
            {loadingOrders ? (
              <div className="text-center py-20 text-[#4F8881] flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-[#F3A2BE] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold">Hämtar köksordrar...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20 diner-glass-card rounded-3xl text-[#4F8881] flex flex-col items-center gap-3 border-2 border-[#81BFB7]/40 shadow-diner-card">
                <ChefHat className="w-12 h-12 text-[#F3A2BE]" />
                <p className="font-extrabold text-lg">Inga {activeTab === 'Inkommen' ? 'inkomna' : 'klara'} beställningar just nu!</p>
                <p className="text-xs text-[#4F8881]/80">När gästerna lägger sin order dyker de upp här direkt.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOrders.map((order) => {
                  const timeStr = new Date(order.created_at).toLocaleTimeString('sv-SE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const isDone = isStatusMatch(order.status, 'Klar');

                  const parsedItems: any[] = typeof order.items === 'string'
                    ? (() => {
                        try {
                          const res = JSON.parse(order.items);
                          return Array.isArray(res) ? res : [];
                        } catch {
                          return [];
                        }
                      })()
                    : (Array.isArray(order.items) ? order.items : (order.items ? [order.items] : []));

                  const totalCount = parsedItems.reduce((sum: number, item: any) => {
                    const q = Number(item?.quantity || item?.qty || item?.count) || 1;
                    return sum + q;
                  }, 0);

                  return (
                    <div
                      key={order.id}
                      className={`rounded-3xl p-5 border-2 flex flex-col justify-between transition-all duration-300 shadow-diner-card ${
                        !isDone
                          ? 'bg-white/95 border-[#F3A2BE] shadow-[0_0_15px_rgba(243,162,190,0.4)]'
                          : 'bg-[#F0F9F8]/70 border-[#81BFB7]/30 opacity-75'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex justify-between items-start border-b border-[#81BFB7]/30 pb-3">
                          <div>
                            <span className="text-xs font-black text-[#F3A2BE] uppercase tracking-wider">
                              Gäst
                            </span>
                            <h2 className="text-2xl font-black text-[#2D3748] flex items-center gap-2">
                              {order.guest_name}
                            </h2>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs bg-[#FFD3DD] px-2.5 py-1 rounded-full border border-[#F3A2BE] text-[#e11d48] font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {timeStr}
                            </span>
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="space-y-2.5">
                          <div className="text-xs uppercase font-extrabold text-[#4F8881] tracking-wider">
                            Beställda rätter ({totalCount} st)
                          </div>
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {parsedItems.map((item: any, idx: number) => {
                              const name = item.title || item.name || item.item_title || 'Egendesignad Tårta 🎂';
                              const quantity = item.quantity || item.qty || item.count || 1;

                              if (item.cake_details) {
                                const fillingsStr = Array.isArray(item.cake_details.fillings)
                                  ? item.cake_details.fillings.join(', ')
                                  : (item.cake_details.fillings || 'Ingen');
                                const toppingsStr = Array.isArray(item.cake_details.toppings)
                                  ? item.cake_details.toppings.join(', ')
                                  : (item.cake_details.toppings || 'Ingen');

                                return (
                                  <div
                                    key={idx}
                                    className="bg-[#FFD3DD]/30 p-3.5 rounded-2xl border-2 border-[#F3A2BE] flex flex-col gap-1.5 text-xs text-[#2D3748] shadow-sm"
                                  >
                                    <div className="flex justify-between items-center font-extrabold text-sm text-[#e11d48]">
                                      <span>{name}</span>
                                      <span className="font-black text-white bg-[#e11d48] px-2.5 py-0.5 rounded-full text-xs shadow-sm">
                                        x{quantity}
                                      </span>
                                    </div>
                                    <div className="font-bold text-[#4F8881]">
                                      🥞 Botten: <span className="font-medium text-[#2D3748]">{item.cake_details.base || 'Ingen'}</span>
                                    </div>
                                    <div className="font-bold text-[#4F8881]">
                                      🍓 Fyllning: <span className="font-medium text-[#2D3748]">{fillingsStr}</span>
                                    </div>
                                    <div className="font-bold text-[#4F8881]">
                                      ✨ Topping: <span className="font-medium text-[#2D3748]">{toppingsStr}</span>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={idx}
                                  className="bg-[#F0F9F8] p-3 rounded-2xl border border-[#81BFB7]/30 flex justify-between items-center text-sm font-semibold text-[#2D3748]"
                                >
                                  <span className="truncate pr-2 font-medium">{name}</span>
                                  <span className="font-black text-white bg-[#F3A2BE] px-2.5 py-0.5 rounded-full text-xs shadow-sm">
                                    x{quantity}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-6 pt-3 border-t border-[#81BFB7]/30">
                        {!isDone ? (
                          <button
                            onClick={() => handleMarkAsDone(order.id)}
                            className="w-full bg-[#81BFB7] hover:bg-[#4F8881] text-white font-black py-3 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wide"
                          >
                            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                            <span>Markera som klar</span>
                          </button>
                        ) : (
                          <div className="text-center py-2.5 text-xs font-black text-[#4F8881] bg-[#C6E6E3]/40 rounded-2xl border border-[#81BFB7] flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#81BFB7]" />
                            <span>Order Serverad & Klar</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* --- VIEW 3: KITCHEN MENU MANAGER (MENYHANTERARE) --- */}
        {activeTab === 'Meny' && (
          <div className="flex flex-col gap-6">
            {/* ➕ Add new dish form directly in kitchen */}
            <section className="diner-glass-card rounded-3xl p-6 border-2 border-[#81BFB7]/40 shadow-diner-card">
              <h2 className="text-xl font-black text-[#2D3748] mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#F3A2BE] stroke-[3]" /> Lägg till ny rätt på menyn
              </h2>

              <form onSubmit={handleAddDish} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#4F8881]">Titel & Emoji</label>
                  <input
                    type="text"
                    required
                    placeholder="t.ex. Diner Double Burger 🍔"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-white border-2 border-[#C6E6E3] rounded-2xl px-4 py-2.5 text-sm text-[#2D3748] placeholder-[#81BFB7] focus:outline-none focus:border-[#81BFB7]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#4F8881]">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as CategoryType)}
                    className="bg-white border-2 border-[#C6E6E3] rounded-2xl px-4 py-2.5 text-sm text-[#2D3748] focus:outline-none focus:border-[#81BFB7]"
                  >
                    <option value="Smårätter">Smårätter 🍔</option>
                    <option value="Candy Drinks">Candy Drinks 🍹</option>
                    <option value="Bygg din Tårta">🎂 Bygg din Tårta</option>
                    <option value="Dessert">Dessert 🍨</option>
                    <option value="Tårta - Botten">🥞 Tårta - Botten</option>
                    <option value="Tårta - Fyllning">🍓 Tårta - Fyllning</option>
                    <option value="Tårta - Topping">✨ Tårta - Topping</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-[#4F8881]">Beskrivning</label>
                  <textarea
                    rows={2}
                    placeholder="God beskrivning av rätten för gästerna..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="bg-white border-2 border-[#C6E6E3] rounded-2xl px-4 py-2.5 text-sm text-[#2D3748] placeholder-[#81BFB7] focus:outline-none focus:border-[#81BFB7]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-extrabold text-[#2D3748]">
                    <input
                      type="checkbox"
                      checked={newAvailable}
                      onChange={(e) => setNewAvailable(e.target.checked)}
                      className="w-5 h-5 rounded accent-[#F3A2BE] cursor-pointer"
                    />
                    Tillgänglig i menyn direkt
                  </label>
                </div>

                <div className="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={isAddingDish}
                    className="w-full bg-[#F3A2BE] hover:bg-[#e11d48] text-white font-black py-3.5 rounded-2xl shadow-md transition-all active:scale-95 text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5 stroke-[3]" />
                    Spara & Publicera Ny Rätt
                  </button>
                </div>
              </form>
            </section>

            {/* 📋 Dish List with Available/Slut toggle & Permanent Remove */}
            <section className="diner-glass-card rounded-3xl p-6 border-2 border-[#81BFB7]/40 shadow-diner-card space-y-4">
              <div className="flex justify-between items-center border-b-2 border-[#81BFB7]/30 pb-3">
                <h2 className="text-xl font-black text-[#2D3748] flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[#81BFB7]" /> Alla Rätter i Köket
                </h2>
              </div>

              {loadingMenu ? (
                <div className="text-center py-8 text-[#4F8881]">Laddar rätter...</div>
              ) : menuItems.length === 0 ? (
                <div className="text-center py-8 text-[#4F8881] font-bold">Inga rätter tillagda än. Lägg till rätter via Admin!</div>
              ) : (
                <div className="space-y-3">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl p-4 border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm ${
                        item.available ? 'border-[#C6E6E3]' : 'border-[#FFD3DD] bg-[#FFD3DD]/20 opacity-70'
                      }`}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-[#2D3748] text-base">{item.title}</span>
                          <span className="text-xs bg-[#F0F9F8] px-2.5 py-0.5 rounded-full border border-[#81BFB7]/40 text-[#4F8881] font-bold">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#4A5568]">{item.description}</p>
                      </div>

                      {/* Chef Controls */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Toggle Availability (Slut / Tillgänglig) */}
                        <button
                          onClick={() => handleToggleAvailable(item.id, item.available)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black border-2 transition-all flex items-center gap-1.5 ${
                            item.available
                              ? 'bg-[#C6E6E3] text-[#4F8881] border-[#81BFB7]'
                              : 'bg-[#FFD3DD] text-[#e11d48] border-[#F3A2BE]'
                          }`}
                        >
                          {item.available ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4 stroke-[3]" />}
                          <span>{item.available ? 'Tillgänglig' : 'Slut (Bocka i)'}</span>
                        </button>

                        {/* Permanent Delete */}
                        <button
                          onClick={() => handleDeleteDish(item.id)}
                          className="p-2 text-[#e11d48] hover:bg-[#FFD3DD] rounded-xl border border-[#F3A2BE] transition-colors"
                          title="Ta bort rätten permanent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
