'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Order, MenuItem } from '@/types/database';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Crown,
  Wine,
  Sparkles,
  Utensils,
  Clock,
  User,
  Cake,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Flame,
  Award,
  Calendar,
  ChefHat,
  ChevronRight,
  Info
} from 'lucide-react';
import Link from 'next/link';

interface ParsedItem {
  id?: string | number;
  title?: string;
  name?: string;
  item_title?: string;
  quantity?: number;
  qty?: number;
  count?: number;
  price?: number;
  category?: string;
  cake_details?: {
    base?: string;
    fillings?: string[] | string;
    toppings?: string[] | string;
  };
}

interface DishStat {
  title: string;
  category: string;
  totalQuantity: number;
  orderCount: number;
}

interface GuestItemDetail {
  title: string;
  quantity: number;
  cakeDetails?: {
    base?: string;
    fillings?: string[];
    toppings?: string[];
  };
}

interface GuestStat {
  guestName: string;
  totalItems: number;
  totalOrders: number;
  candyDrinksCount: number;
  items: Map<string, GuestItemDetail>;
  topDish?: string;
}

interface CakeStat {
  bases: Record<string, number>;
  fillings: Record<string, number>;
  toppings: Record<string, number>;
  totalCakes: number;
}

export default function StatisticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatsData = async () => {
    setLoading(true);
    try {
      const [ordersRes, menuRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: true }),
        supabase.from('menu_items').select('*')
      ]);

      if (ordersRes.error) {
        console.error('Error fetching orders:', ordersRes.error);
        setOrders([]);
      } else {
        setOrders(ordersRes.data || []);
      }

      if (menuRes.error) {
        console.error('Error fetching menu items:', menuRes.error);
        setMenuItems([]);
      } else {
        setMenuItems(menuRes.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch statistics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsData();
  }, []);

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  // Helper map from menu item title -> category
  const menuCategoryMap = new Map<string, string>();
  menuItems.forEach((m) => {
    if (m.title && m.category) {
      menuCategoryMap.set(m.title.toLowerCase().trim(), m.category);
    }
  });

  const getCategoryForDish = (title: string, defaultCat?: string): string => {
    if (defaultCat && defaultCat !== 'Uncategorized') return defaultCat;
    const mapped = menuCategoryMap.get(title.toLowerCase().trim());
    if (mapped) return mapped;

    // Fallbacks based on title keywords
    const lower = title.toLowerCase();
    if (
      lower.includes('drink') ||
      lower.includes('fizz') ||
      lower.includes('sur') ||
      lower.includes(' splash') ||
      lower.includes('bilar') ||
      lower.includes('cola') ||
      lower.includes('watermelon') ||
      lower.includes('soda')
    ) {
      return 'Candy Drinks';
    }
    if (lower.includes('tårta') || lower.includes('cake') || lower.includes('botten')) {
      return 'Bygg din Tårta';
    }
    if (
      lower.includes('churros') ||
      lower.includes('maräng') ||
      lower.includes('sundae') ||
      lower.includes('nutella') ||
      lower.includes('glass')
    ) {
      return 'Dessert';
    }
    return 'Smårätter';
  };

  // Data processing & aggregation
  const dishStatsMap = new Map<string, DishStat>();
  const guestStatsMap = new Map<string, GuestStat>();
  const cakeStats: CakeStat = {
    bases: {},
    fillings: {},
    toppings: {},
    totalCakes: 0
  };

  let totalItemsOrderedCount = 0;

  orders.forEach((order) => {
    const rawGuest = order.guest_name?.trim() || 'Okänd Gäst';

    if (!guestStatsMap.has(rawGuest)) {
      guestStatsMap.set(rawGuest, {
        guestName: rawGuest,
        totalItems: 0,
        totalOrders: 0,
        candyDrinksCount: 0,
        items: new Map<string, GuestItemDetail>()
      });
    }

    const guestStat = guestStatsMap.get(rawGuest)!;
    guestStat.totalOrders += 1;

    // Safe item parsing logic
    let parsedItemsList: ParsedItem[] = [];
    if (typeof order.items === 'string') {
      try {
        const parsed = JSON.parse(order.items);
        parsedItemsList = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        parsedItemsList = [];
      }
    } else if (Array.isArray(order.items)) {
      parsedItemsList = order.items;
    } else if (order.items && typeof order.items === 'object') {
      parsedItemsList = [order.items];
    }

    parsedItemsList.forEach((item) => {
      if (!item) return;

      const title =
        item.title || item.name || item.item_title || (item.cake_details ? 'Egendesignad Tårta 🎂' : 'Okänd Rätt');
      const qty = Number(item.quantity || item.qty || item.count) || 1;
      const category = getCategoryForDish(title, item.category);

      totalItemsOrderedCount += qty;

      // 1. Dish Aggregation
      if (!dishStatsMap.has(title)) {
        dishStatsMap.set(title, {
          title,
          category,
          totalQuantity: 0,
          orderCount: 0
        });
      }
      const dishStat = dishStatsMap.get(title)!;
      dishStat.totalQuantity += qty;
      dishStat.orderCount += 1;

      // 2. Guest Aggregation
      guestStat.totalItems += qty;

      if (category === 'Candy Drinks') {
        guestStat.candyDrinksCount += qty;
      }

      if (!guestStat.items.has(title)) {
        let cakeDetailsObj: GuestItemDetail['cakeDetails'] = undefined;
        if (item.cake_details) {
          const fillingsArr = Array.isArray(item.cake_details.fillings)
            ? item.cake_details.fillings
            : item.cake_details.fillings
            ? [item.cake_details.fillings]
            : [];
          const toppingsArr = Array.isArray(item.cake_details.toppings)
            ? item.cake_details.toppings
            : item.cake_details.toppings
            ? [item.cake_details.toppings]
            : [];

          cakeDetailsObj = {
            base: item.cake_details.base,
            fillings: fillingsArr,
            toppings: toppingsArr
          };
        }

        guestStat.items.set(title, {
          title,
          quantity: 0,
          cakeDetails: cakeDetailsObj
        });
      }
      guestStat.items.get(title)!.quantity += qty;

      // 3. Cake Details Aggregation
      if (item.cake_details) {
        cakeStats.totalCakes += qty;

        if (item.cake_details.base) {
          const baseName = item.cake_details.base;
          cakeStats.bases[baseName] = (cakeStats.bases[baseName] || 0) + qty;
        }

        const fillingsArr = Array.isArray(item.cake_details.fillings)
          ? item.cake_details.fillings
          : item.cake_details.fillings
          ? [item.cake_details.fillings]
          : [];
        fillingsArr.forEach((f) => {
          if (f) cakeStats.fillings[f] = (cakeStats.fillings[f] || 0) + qty;
        });

        const toppingsArr = Array.isArray(item.cake_details.toppings)
          ? item.cake_details.toppings
          : item.cake_details.toppings
          ? [item.cake_details.toppings]
          : [];
        toppingsArr.forEach((t) => {
          if (t) cakeStats.toppings[t] = (cakeStats.toppings[t] || 0) + qty;
        });
      }
    });
  });

  // Calculate favorite dish per guest
  guestStatsMap.forEach((guest) => {
    let maxQty = 0;
    let favTitle = '';
    guest.items.forEach((item) => {
      if (item.quantity > maxQty) {
        maxQty = item.quantity;
        favTitle = item.title;
      }
    });
    guest.topDish = favTitle;
  });

  // Sorted lists
  const sortedDishes = Array.from(dishStatsMap.values()).sort(
    (a, b) => b.totalQuantity - a.totalQuantity || b.orderCount - a.orderCount
  );

  const sortedGuests = Array.from(guestStatsMap.values()).sort(
    (a, b) => b.totalItems - a.totalItems || b.totalOrders - a.totalOrders
  );

  const candyDrinkChampions = Array.from(guestStatsMap.values()).sort(
    (a, b) => b.candyDrinksCount - a.candyDrinksCount || b.totalItems - a.totalItems
  );

  // Top 3 Podium Highlights
  const topDish = sortedDishes[0] || null;
  const topGuest = sortedGuests[0] || null;
  const topDrinkChampion = candyDrinkChampions.find((g) => g.candyDrinksCount > 0) || candyDrinkChampions[0] || null;

  // Timeline derivation
  let firstOrderDate: Date | null = null;
  let lastOrderDate: Date | null = null;
  if (orders.length > 0) {
    const dates = orders
      .map((o) => new Date(o.created_at))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length > 0) {
      firstOrderDate = dates[0];
      lastOrderDate = dates[dates.length - 1];
    }
  }

  const formatTimeStr = (d: Date | null) => {
    if (!d) return '–';
    return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateStr = (d: Date | null) => {
    if (!d) return '–';
    return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Helper for sorting object key-value pairs (for cakes)
  const getSortedKeyValue = (obj: Record<string, number>) => {
    return Object.entries(obj).sort((a, b) => b[1] - a[1]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* HEADER BANNER */}
      <header className="relative diner-glass-card rounded-3xl p-6 sm:p-8 border-2 border-[#81BFB7] shadow-xl overflow-hidden text-center space-y-4">
        <div className="absolute top-0 left-0 right-0 h-3 diner-stripe-bg"></div>

        <div className="flex flex-col items-center justify-center gap-2 pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFD3DD] border border-[#F3A2BE] text-[#e11d48] font-black text-xs uppercase tracking-widest shadow-sm">
            <Sparkles className="w-4 h-4 animate-spin" /> Slutsummering & Kalas-Analys
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#2D3748] tracking-tight">
            Kalasets <span className="diner-neon-text-dark drop-shadow-md">Statistik</span>
          </h1>

          <p className="text-sm sm:text-base text-[#4F8881] font-semibold max-w-2xl">
            Tack för en fantastisk kväll på Loppiloo's Diner! Här är den fullständiga sammanställningen över vad som åt(s), drack(s) och vem som storsatsade på menyn.
          </p>
        </div>

        {/* QUICK METRICS RIBBON */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t-2 border-[#81BFB7]/30">
          <div className="bg-white/80 rounded-2xl p-3.5 border border-[#81BFB7]/40 text-center shadow-sm">
            <div className="text-xs font-black text-[#4F8881] uppercase tracking-wider flex items-center justify-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-[#F3A2BE]" /> Totalt Beställt
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#e11d48] mt-1">{totalItemsOrderedCount} st</div>
            <div className="text-[10px] font-bold text-[#4F8881]">rätter & drycker</div>
          </div>

          <div className="bg-white/80 rounded-2xl p-3.5 border border-[#81BFB7]/40 text-center shadow-sm">
            <div className="text-xs font-black text-[#4F8881] uppercase tracking-wider flex items-center justify-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-[#81BFB7]" /> Antal Beställningar
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#2D3748] mt-1">{orders.length} st</div>
            <div className="text-[10px] font-bold text-[#4F8881]">inkomna bongar</div>
          </div>

          <div className="bg-white/80 rounded-2xl p-3.5 border border-[#81BFB7]/40 text-center shadow-sm">
            <div className="text-xs font-black text-[#4F8881] uppercase tracking-wider flex items-center justify-center gap-1">
              <User className="w-3.5 h-3.5 text-[#F3A2BE]" /> Unika Gäster
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#2D3748] mt-1">{sortedGuests.length} st</div>
            <div className="text-[10px] font-bold text-[#4F8881]">glada matgäster</div>
          </div>

          <div className="bg-white/80 rounded-2xl p-3.5 border border-[#81BFB7]/40 text-center shadow-sm">
            <div className="text-xs font-black text-[#4F8881] uppercase tracking-wider flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#81BFB7]" /> Tidsfönster
            </div>
            <div className="text-lg sm:text-xl font-black text-[#2D3748] mt-1">
              {formatTimeStr(firstOrderDate)} – {formatTimeStr(lastOrderDate)}
            </div>
            <div className="text-[10px] font-bold text-[#4F8881]">
              {firstOrderDate ? formatDateStr(firstOrderDate) : 'Kalaskväll'}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => {
              triggerCelebration();
              fetchStatsData();
            }}
            disabled={loading}
            className="px-5 py-2.5 rounded-2xl bg-[#81BFB7] hover:bg-[#4F8881] text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Uppdatera & Fira 🎊
          </button>
        </div>
      </header>

      {loading ? (
        <div className="diner-glass-card rounded-3xl p-16 text-center space-y-4 border-2 border-[#81BFB7]/40">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#F3A2BE] border-t-transparent"></div>
          <p className="text-lg font-black text-[#4F8881]">Analyserar alla bongar från Supabase...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="diner-glass-card rounded-3xl p-12 text-center space-y-4 border-2 border-[#81BFB7]/40">
          <Info className="w-12 h-12 text-[#F3A2BE] mx-auto" />
          <h2 className="text-2xl font-black text-[#2D3748]">Inga beställningar hittades ännu</h2>
          <p className="text-sm text-[#4F8881]">Det finns inga registrerade rader i orders-tabellen.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#e11d48] text-white font-black text-sm uppercase tracking-wide shadow-md hover:bg-[#be123c] transition-all"
          >
            Lägg första beställningen 🍦
          </Link>
        </div>
      ) : (
        <>
          {/* TOP 3 HALL OF FAME PODIUM */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-black text-[#2D3748] flex items-center gap-2">
                <Trophy className="w-7 h-7 text-[#F3A2BE]" /> Hall of Fame 🏆
              </h2>
              <span className="text-xs font-bold text-[#4F8881] bg-white/70 px-3 py-1 rounded-full border border-[#81BFB7]/40">
                Toppprestationer
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 🥇 1. MOST POPULAR DISH */}
              <div className="diner-glass-card rounded-3xl p-6 border-2 border-[#F3A2BE] shadow-lg relative flex flex-col justify-between overflow-hidden hover:scale-[1.02] transition-transform">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-[#F3A2BE] to-transparent text-white px-4 py-1 rounded-bl-2xl font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  🥇 Mest Populär
                </div>

                <div className="space-y-3 pt-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFD3DD] border-2 border-[#F3A2BE] flex items-center justify-center text-2xl shadow-sm">
                    🏆
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#F3A2BE] uppercase tracking-wider">
                      Kalasets Mest Populära Rätt
                    </span>
                    <h3 className="text-2xl font-black text-[#2D3748] leading-snug mt-1">
                      {topDish ? topDish.title : 'Ingen ännu'}
                    </h3>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#81BFB7]/30 flex justify-between items-end">
                  <div>
                    <div className="text-3xl font-black text-[#e11d48]">
                      {topDish ? topDish.totalQuantity : 0} st
                    </div>
                    <div className="text-xs font-bold text-[#4F8881]">
                      beställda i kväll ({topDish ? topDish.orderCount : 0} bongar)
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#4F8881] bg-[#F0F9F8] px-2.5 py-1 rounded-full border border-[#81BFB7]/40">
                    {topDish ? topDish.category : 'Mat'}
                  </span>
                </div>
              </div>

              {/* 👑 2. BIGGEST CUSTOMER */}
              <div className="diner-glass-card rounded-3xl p-6 border-2 border-[#81BFB7] shadow-lg relative flex flex-col justify-between overflow-hidden hover:scale-[1.02] transition-transform">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-[#81BFB7] to-transparent text-white px-4 py-1 rounded-bl-2xl font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  👑 Kung / Drottning
                </div>

                <div className="space-y-3 pt-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#C6E6E3] border-2 border-[#81BFB7] flex items-center justify-center text-2xl shadow-sm">
                    👑
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#4F8881] uppercase tracking-wider">
                      Kalasets Största Beställare
                    </span>
                    <h3 className="text-2xl font-black text-[#2D3748] leading-snug mt-1">
                      {topGuest ? topGuest.guestName : 'Ingen ännu'}
                    </h3>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#81BFB7]/30 flex justify-between items-end">
                  <div>
                    <div className="text-3xl font-black text-[#4F8881]">
                      {topGuest ? topGuest.totalItems : 0} st
                    </div>
                    <div className="text-xs font-bold text-[#4F8881]">
                      rätter totalt ({topGuest ? topGuest.totalOrders : 0} beställningar)
                    </div>
                  </div>
                  {topGuest?.topDish && (
                    <div className="text-right max-w-[120px]">
                      <div className="text-[10px] font-bold text-[#4F8881]">Favorit:</div>
                      <div className="text-xs font-black text-[#2D3748] truncate">{topGuest.topDish}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* 🥤 3. CANDY DRINK CHAMPION */}
              <div className="diner-glass-card rounded-3xl p-6 border-2 border-[#F3A2BE] shadow-lg relative flex flex-col justify-between overflow-hidden hover:scale-[1.02] transition-transform">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-[#e11d48] to-transparent text-white px-4 py-1 rounded-bl-2xl font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  🥤 Drinkmästare
                </div>

                <div className="space-y-3 pt-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFD3DD] border-2 border-[#F3A2BE] flex items-center justify-center text-2xl shadow-sm">
                    🥤
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#e11d48] uppercase tracking-wider">
                      Candy Drink Champion
                    </span>
                    <h3 className="text-2xl font-black text-[#2D3748] leading-snug mt-1">
                      {topDrinkChampion ? topDrinkChampion.guestName : 'Ingen ännu'}
                    </h3>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#81BFB7]/30 flex justify-between items-end">
                  <div>
                    <div className="text-3xl font-black text-[#e11d48]">
                      {topDrinkChampion ? topDrinkChampion.candyDrinksCount : 0} st
                    </div>
                    <div className="text-xs font-bold text-[#4F8881]">
                      godisdrinkar avnjutna 🍬
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white bg-[#e11d48] px-2.5 py-1 rounded-full shadow-sm">
                    Sur & Söt 🎉
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* LEADERBOARD & CAKE ANALYSIS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* TOPPLISTA RÄTTER (2 Cols) */}
            <section className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#81BFB7]/30 pb-3">
                <h2 className="text-2xl font-black text-[#2D3748] flex items-center gap-2">
                  <Flame className="w-6 h-6 text-[#e11d48]" /> Topplista Rätter
                </h2>
                <span className="text-xs font-bold text-[#4F8881] bg-white/70 px-3 py-1 rounded-full border border-[#81BFB7]/40">
                  {sortedDishes.length} olika valda rätter
                </span>
              </div>

              <div className="diner-glass-card rounded-3xl p-5 border-2 border-[#81BFB7]/40 shadow-md space-y-3">
                {sortedDishes.map((dish, index) => {
                  const maxQty = sortedDishes[0]?.totalQuantity || 1;
                  const percent = Math.round((dish.totalQuantity / maxQty) * 100);

                  let rankBadge = (
                    <span className="w-7 h-7 rounded-full bg-[#F0F9F8] border border-[#81BFB7] text-[#4F8881] font-black text-xs flex items-center justify-center shrink-0">
                      #{index + 1}
                    </span>
                  );
                  if (index === 0) {
                    rankBadge = (
                      <span className="w-8 h-8 rounded-full bg-[#FFD3DD] border-2 border-[#F3A2BE] text-lg flex items-center justify-center shrink-0 shadow-sm">
                        🥇
                      </span>
                    );
                  } else if (index === 1) {
                    rankBadge = (
                      <span className="w-8 h-8 rounded-full bg-[#C6E6E3] border-2 border-[#81BFB7] text-lg flex items-center justify-center shrink-0 shadow-sm">
                        🥈
                      </span>
                    );
                  } else if (index === 2) {
                    rankBadge = (
                      <span className="w-8 h-8 rounded-full bg-[#FFE4E1] border-2 border-[#F3A2BE] text-lg flex items-center justify-center shrink-0 shadow-sm">
                        🥉
                      </span>
                    );
                  }

                  return (
                    <div
                      key={dish.title}
                      className="bg-white/80 rounded-2xl p-3.5 border border-[#81BFB7]/30 flex flex-col gap-2 hover:border-[#81BFB7] transition-all shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {rankBadge}
                          <div className="min-w-0">
                            <h4 className="font-black text-[#2D3748] text-sm sm:text-base truncate">
                              {dish.title}
                            </h4>
                            <span className="text-[11px] font-bold text-[#4F8881] bg-[#F0F9F8] px-2 py-0.5 rounded-full border border-[#81BFB7]/30">
                              {dish.category}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-lg font-black text-[#e11d48]">{dish.totalQuantity} st</span>
                          <div className="text-[10px] font-bold text-[#4F8881]">
                            på {dish.orderCount} order(s)
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-[#F0F9F8] rounded-full h-2 overflow-hidden border border-[#81BFB7]/20">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            index === 0 ? 'bg-[#e11d48]' : index === 1 ? 'bg-[#81BFB7]' : 'bg-[#F3A2BE]'
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* TÅRT-ANALYS (1 Col) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#81BFB7]/30 pb-3">
                <h2 className="text-2xl font-black text-[#2D3748] flex items-center gap-2">
                  <Cake className="w-6 h-6 text-[#F3A2BE]" /> Tårt-Analys 🎂
                </h2>
              </div>

              <div className="diner-glass-card rounded-3xl p-5 border-2 border-[#F3A2BE]/50 shadow-md space-y-5">
                <div className="text-center bg-[#FFD3DD]/40 p-3 rounded-2xl border border-[#F3A2BE]">
                  <span className="text-xs font-black text-[#e11d48] uppercase tracking-wider">
                    Totalt Skapade Tårtor
                  </span>
                  <div className="text-3xl font-black text-[#2D3748]">{cakeStats.totalCakes} st</div>
                </div>

                {/* Popular Bases */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-[#4F8881] uppercase tracking-wider flex items-center gap-1">
                    🥞 Populäraste Botten
                  </h4>
                  <div className="space-y-1.5">
                    {getSortedKeyValue(cakeStats.bases).length === 0 ? (
                      <p className="text-xs text-[#4F8881] italic">Inga tårtbottnar valda ännu</p>
                    ) : (
                      getSortedKeyValue(cakeStats.bases).map(([base, count]) => (
                        <div
                          key={base}
                          className="bg-white p-2.5 rounded-xl border border-[#81BFB7]/30 flex justify-between items-center text-xs font-bold text-[#2D3748]"
                        >
                          <span>{base}</span>
                          <span className="bg-[#81BFB7] text-white px-2 py-0.5 rounded-full text-[11px] font-black">
                            {count} st
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Popular Toppings */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-[#4F8881] uppercase tracking-wider flex items-center gap-1">
                    ✨ Populäraste Toppings
                  </h4>
                  <div className="space-y-1.5">
                    {getSortedKeyValue(cakeStats.toppings).length === 0 ? (
                      <p className="text-xs text-[#4F8881] italic">Inga toppings registrerade</p>
                    ) : (
                      getSortedKeyValue(cakeStats.toppings).map(([topping, count]) => (
                        <div
                          key={topping}
                          className="bg-white p-2.5 rounded-xl border border-[#F3A2BE]/40 flex justify-between items-center text-xs font-bold text-[#2D3748]"
                        >
                          <span>{topping}</span>
                          <span className="bg-[#F3A2BE] text-white px-2 py-0.5 rounded-full text-[11px] font-black">
                            {count} st
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Popular Fillings */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-[#4F8881] uppercase tracking-wider flex items-center gap-1">
                    🍓 Populäraste Fyllningar
                  </h4>
                  <div className="space-y-1.5">
                    {getSortedKeyValue(cakeStats.fillings).length === 0 ? (
                      <p className="text-xs text-[#4F8881] italic">Inga fyllningar registrerade</p>
                    ) : (
                      getSortedKeyValue(cakeStats.fillings).map(([filling, count]) => (
                        <div
                          key={filling}
                          className="bg-white p-2.5 rounded-xl border border-[#81BFB7]/30 flex justify-between items-center text-xs font-bold text-[#2D3748]"
                        >
                          <span>{filling}</span>
                          <span className="bg-[#4F8881] text-white px-2 py-0.5 rounded-full text-[11px] font-black">
                            {count} st
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* GÄSTPROFILER (Kort per person) */}
          <section className="space-y-5">
            <div className="flex items-center justify-between border-b-2 border-[#81BFB7]/30 pb-3">
              <h2 className="text-2xl sm:text-3xl font-black text-[#2D3748] flex items-center gap-2">
                <User className="w-7 h-7 text-[#F3A2BE]" /> Gästprofiler & Personlig Sammanställning 👤
              </h2>
              <span className="text-xs font-bold text-[#4F8881] bg-white/70 px-3 py-1 rounded-full border border-[#81BFB7]/40">
                Alla matgäster
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedGuests.map((guest, index) => {
                const itemList = Array.from(guest.items.values());

                return (
                  <div
                    key={guest.guestName}
                    className="diner-glass-card rounded-3xl p-6 border-2 border-[#81BFB7]/40 shadow-md flex flex-col justify-between space-y-4 hover:border-[#81BFB7] transition-all"
                  >
                    <div className="space-y-4">
                      {/* Guest Header */}
                      <div className="flex justify-between items-start border-b border-[#81BFB7]/30 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#FFD3DD] border border-[#F3A2BE] flex items-center justify-center font-black text-[#e11d48] text-lg shadow-sm">
                            {guest.guestName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-[#2D3748]">{guest.guestName}</h3>
                            <span className="text-[11px] font-bold text-[#4F8881]">
                              Placerade {guest.totalOrders} beställning(ar)
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-black text-[#e11d48]">{guest.totalItems} st</span>
                          <div className="text-[10px] font-bold text-[#4F8881]">totalt</div>
                        </div>
                      </div>

                      {/* Guest Favorite */}
                      {guest.topDish && (
                        <div className="bg-[#F0F9F8] p-2.5 rounded-xl border border-[#81BFB7]/30 text-xs font-semibold text-[#4F8881] flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-[#e11d48] shrink-0" />
                          <span className="truncate">
                            Favorit: <strong className="text-[#2D3748]">{guest.topDish}</strong>
                          </span>
                        </div>
                      )}

                      {/* Personal Item Breakdown List */}
                      <div className="space-y-2">
                        <div className="text-xs uppercase font-extrabold text-[#4F8881] tracking-wider">
                          Alla avnjutna rätter ({itemList.length} unika):
                        </div>
                        <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {itemList.map((item, i) => (
                            <li
                              key={i}
                              className="bg-white/90 p-2.5 rounded-xl border border-[#81BFB7]/30 text-xs font-semibold text-[#2D3748] space-y-1 shadow-sm"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-[#2D3748] flex items-center gap-1.5">
                                  <ChevronRight className="w-3.5 h-3.5 text-[#F3A2BE]" />
                                  {item.title}
                                </span>
                                <span className="font-black text-white bg-[#81BFB7] px-2 py-0.5 rounded-full text-[11px]">
                                  x{item.quantity}
                                </span>
                              </div>

                              {item.cakeDetails && (
                                <div className="ml-5 p-2 rounded-lg bg-[#FFD3DD]/30 border border-[#F3A2BE]/40 text-[11px] text-[#4F8881] space-y-0.5">
                                  <div>
                                    🥞 Botten: <strong className="text-[#2D3748]">{item.cakeDetails.base || 'Ingen'}</strong>
                                  </div>
                                  {item.cakeDetails.fillings && item.cakeDetails.fillings.length > 0 && (
                                    <div>
                                      🍓 Fyllning: <strong className="text-[#2D3748]">{item.cakeDetails.fillings.join(', ')}</strong>
                                    </div>
                                  )}
                                  {item.cakeDetails.toppings && item.cakeDetails.toppings.length > 0 && (
                                    <div>
                                      ✨ Topping: <strong className="text-[#2D3748]">{item.cakeDetails.toppings.join(', ')}</strong>
                                    </div>
                                  )}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* TIDSLINJE & KALASÖVERSIKT */}
          <section className="diner-glass-card rounded-3xl p-6 sm:p-8 border-2 border-[#81BFB7] shadow-lg space-y-6">
            <div className="flex items-center justify-between border-b-2 border-[#81BFB7]/30 pb-3">
              <h2 className="text-2xl font-black text-[#2D3748] flex items-center gap-2">
                <Clock className="w-6 h-6 text-[#81BFB7]" /> Tidslinje & Kalasöversikt
              </h2>
              <span className="text-xs font-bold text-[#4F8881]">Kronologisk historik</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-[#81BFB7]/30 space-y-1">
                <span className="text-xs font-extrabold text-[#4F8881] uppercase tracking-wider flex items-center gap-1">
                  🟢 Första Beställningen
                </span>
                <div className="text-2xl font-black text-[#2D3748]">{formatTimeStr(firstOrderDate)}</div>
                <div className="text-xs font-semibold text-[#4F8881]">Startskottet för kvällen 🚀</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#81BFB7]/30 space-y-1">
                <span className="text-xs font-extrabold text-[#4F8881] uppercase tracking-wider flex items-center gap-1">
                  🏁 Sista Beställningen
                </span>
                <div className="text-2xl font-black text-[#2D3748]">{formatTimeStr(lastOrderDate)}</div>
                <div className="text-xs font-semibold text-[#4F8881]">Sista bongen i köket 🍽️</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#81BFB7]/30 space-y-1">
                <span className="text-xs font-extrabold text-[#4F8881] uppercase tracking-wider flex items-center gap-1">
                  📊 Snitt Rätter / Order
                </span>
                <div className="text-2xl font-black text-[#e11d48]">
                  {orders.length > 0 ? (totalItemsOrderedCount / orders.length).toFixed(1) : 0} st
                </div>
                <div className="text-xs font-semibold text-[#4F8881]">Per levererad bong</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#81BFB7]/30 space-y-1">
                <span className="text-xs font-extrabold text-[#4F8881] uppercase tracking-wider flex items-center gap-1">
                  🧁 Snitt Rätter / Gäst
                </span>
                <div className="text-2xl font-black text-[#81BFB7]">
                  {sortedGuests.length > 0 ? (totalItemsOrderedCount / sortedGuests.length).toFixed(1) : 0} st
                </div>
                <div className="text-xs font-semibold text-[#4F8881]">Per kalasgäst</div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* FOOTER NAV */}
      <footer className="flex justify-between items-center text-xs font-bold text-[#4F8881] pt-6 border-t border-[#81BFB7]/30">
        <div>Loppiloo's 50's Diner • Slutstatistik</div>
        <div className="flex gap-4">
          <Link href="/" className="hover:text-[#e11d48] transition-colors">
            🍦 Gästvy
          </Link>
          <Link href="/kok" className="hover:text-[#e11d48] transition-colors">
            👨‍🍳 Köksvy
          </Link>
          <Link href="/admin" className="hover:text-[#e11d48] transition-colors">
            ⚙️ Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
