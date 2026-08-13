'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Order } from '@/types/database';
import { BellRing, CheckCircle2, Clock, Volume2, RefreshCw, ChefHat, Filter } from 'lucide-react';

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Inkommen' | 'Klar'>('Inkommen');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastNotificationTime, setLastNotificationTime] = useState<string | null>(null);

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

      // Create dual-tone chime (High C & E)
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

  useEffect(() => {
    fetchOrders();

    if (!isSupabaseConfigured()) {
      // Mock sample orders if Supabase isn't configured yet
      setOrders([
        {
          id: 'demo-1',
          guest_name: 'Felicia',
          items: [
            { id: '1', title: 'Mini Cheeseburger 🍔', quantity: 2, price: 38, category: 'Smårätter' },
            { id: '3', title: 'Sötpotatispommes 🍟', quantity: 1, price: 32, category: 'Smårätter' },
            { id: '7', title: 'Fizz Wiz Bubblegum 🍬', quantity: 1, price: 42, category: 'Candy Drinks' },
          ],
          status: 'Inkommen',
          created_at: new Date().toISOString(),
        },
        {
          id: 'demo-2',
          guest_name: 'Tommy',
          items: [
            { id: '4', title: 'Tacos de Carne 🌮', quantity: 3, price: 36, category: 'Smårätter' },
            { id: '12', title: 'Churros med Nutella 🍫', quantity: 1, price: 38, category: 'Dessert' },
          ],
          status: 'Inkommen',
          created_at: new Date(Date.now() - 5 * 60000).toISOString(),
        },
      ]);
      setLoading(false);
      return;
    }

    // Subscribe to Supabase Realtime for orders table
    const subscription = supabase
      .channel('kitchen-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('New realtime order arrived!', payload);
          const newOrder = payload.new as Order;
          setOrders((prev) => [newOrder, ...prev]);

          if (soundEnabled) {
            playPlingSound();
          }
          setLastNotificationTime(new Date().toLocaleTimeString('sv-SE'));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [soundEnabled]);

  const fetchOrders = async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
      } else if (data) {
        setOrders(data as Order[]);
      }
    } catch (err) {
      console.error('Failed fetching kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDone = async (orderId: string) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Klar' as const } : o))
    );

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'Klar' })
          .eq('id', orderId);

        if (error) {
          console.error('Error updating order status:', error);
        }
      } catch (err) {
        console.error('Failed updating order status in Supabase:', err);
      }
    }
  };

  const filteredOrders = orders.filter((o) => o.status === activeTab);
  const activeCount = orders.filter((o) => o.status === 'Inkommen').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 👨‍🍳 Kitchen Header */}
      <header className="bg-slate-900 border-b-2 border-amber-500/40 p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-900 to-rose-950 border border-amber-400/50 flex items-center justify-center text-2xl shadow-gold-glow">
            👨‍🍳
          </div>
          <div>
            <h1 className="text-2xl font-black text-amber-400 gold-text-glow flex items-center gap-2">
              Köksvy | Loppiloo's
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Realtime live-orderström
              {lastNotificationTime && ` • Senaste pling: ${lastNotificationTime}`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playPlingSound();
              setSoundEnabled(!soundEnabled);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all ${
              soundEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{soundEnabled ? 'Ljud På (Testa)' : 'Ljud Av'}</span>
          </button>

          <button
            onClick={fetchOrders}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-300 transition-colors"
            title="Uppdatera manuellt"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl w-full mx-auto p-4 flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('Inkommen')}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-sm flex items-center gap-2 border transition-all ${
                activeTab === 'Inkommen'
                  ? 'bg-rose-900 text-amber-300 border-amber-400 shadow-gold-glow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <BellRing className="w-4 h-4 text-amber-400" />
              <span>Inkomna beställningar</span>
              {activeCount > 0 && (
                <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-xs font-black">
                  {activeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('Klar')}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-sm flex items-center gap-2 border transition-all ${
                activeTab === 'Klar'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Färdiga (Klara)</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            Sorterat: Nyast först
          </div>
        </div>

        {/* Order Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Hämtar inkomna köksordrar...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 pinchos-glass-card rounded-2xl text-slate-400 flex flex-col items-center gap-3">
            <ChefHat className="w-12 h-12 text-slate-600" />
            <p className="font-bold text-lg">Inga {activeTab === 'Inkommen' ? 'inkomna' : 'klara'} beställningar just nu!</p>
            <p className="text-xs text-slate-500">När gäster skickar in sin mat dyker korten upp här direkt.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOrders.map((order) => {
              const timeStr = new Date(order.created_at).toLocaleTimeString('sv-SE', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl p-5 border flex flex-col justify-between transition-all duration-300 shadow-xl ${
                    order.status === 'Inkommen'
                      ? 'bg-slate-900/90 border-amber-400 shadow-gold-glow'
                      : 'bg-slate-950/60 border-slate-800 opacity-70'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-amber-500/20 pb-3">
                      <div>
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Gäst
                        </span>
                        <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
                          {order.guest_name}
                        </h2>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-amber-500/30 text-amber-300 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" /> {timeStr}
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-2.5">
                      <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                        Beställda rätter ({order.items.reduce((sum, i) => sum + i.quantity, 0)} st)
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950/80 p-2.5 rounded-xl border border-amber-500/10 flex justify-between items-center text-sm"
                          >
                            <span className="font-semibold text-slate-100">{item.title}</span>
                            <span className="font-black text-amber-400 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-lg">
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-3 border-t border-amber-500/20">
                    {order.status === 'Inkommen' ? (
                      <button
                        onClick={() => handleMarkAsDone(order.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                      >
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                        <span>Markera som klar</span>
                      </button>
                    ) : (
                      <div className="text-center py-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 rounded-xl border border-emerald-800 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Order Serverad & Klar</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
