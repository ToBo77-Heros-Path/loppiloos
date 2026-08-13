'use me';
'use client';

import { useState, useEffect } from 'react';
import { supabase, DEFAULT_MENU_ITEMS, isSupabaseConfigured } from '@/lib/supabase';
import { MenuItem, CategoryType } from '@/types/database';
import { Plus, Trash2, Check, X, Settings, Utensils, AlertCircle } from 'lucide-react';

export default function AdminPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for adding new item
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryType>('Smårätter');
  const [price, setPrice] = useState<number>(35);
  const [isAvailable, setIsAvailable] = useState(true);

  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    fetchAdminItems();
  }, []);

  const fetchAdminItems = async () => {
    setLoading(true);
    if (!isSupabaseConfigured()) {
      setItems(DEFAULT_MENU_ITEMS);
      setUsingFallback(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('Fallback due to Supabase admin fetch error:', error);
        setItems(DEFAULT_MENU_ITEMS);
        setUsingFallback(true);
      } else {
        setItems(data as MenuItem[]);
        setUsingFallback(false);
      }
    } catch (err) {
      console.error('Error fetching admin menu items:', err);
      setItems(DEFAULT_MENU_ITEMS);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newItem: Partial<MenuItem> = {
      title: title.trim(),
      description: description.trim(),
      category,
      price,
      available: isAvailable,
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('menu_items').insert([newItem]).select();
        if (error) {
          console.error('Error adding item to Supabase:', error);
        } else if (data && data[0]) {
          setItems((prev) => [data[0] as MenuItem, ...prev]);
        }
      } catch (err) {
        console.error('Error inserting menu item:', err);
      }
    } else {
      // Local fallback state
      const createdItem: MenuItem = {
        id: `mock-${Date.now()}`,
        title: newItem.title!,
        description: newItem.description!,
        category: newItem.category!,
        price: newItem.price!,
        available: newItem.available!,
      };
      setItems((prev) => [createdItem, ...prev]);
    }

    // Reset form
    setTitle('');
    setDescription('');
    setPrice(35);
    setIsAvailable(true);
  };

  const handleToggleAvailable = async (id: string, currentAvailable: boolean) => {
    const nextAvailable = !currentAvailable;
    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, available: nextAvailable } : i))
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('menu_items')
          .update({ available: nextAvailable })
          .eq('id', id);
      } catch (err) {
        console.error('Failed toggling availability:', err);
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna rätt från cirkusmenyn?')) return;

    setItems((prev) => prev.filter((i) => i.id !== id));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('menu_items').delete().eq('id', id);
      } catch (err) {
        console.error('Failed deleting menu item:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        {/* Header */}
        <header className="circus-stripe-bg rounded-3xl p-6 border-2 border-amber-400 text-center shadow-gold-glow flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-slate-950 border border-amber-400 flex items-center justify-center text-2xl">
            ⚙️
          </div>
          <h1 className="text-3xl font-black text-amber-400 gold-text-glow font-serif">
            Menyhantering | Loppiloo's
          </h1>
          <p className="text-xs text-rose-200">
            Lägg till nya godbitar eller bocka i vad som finns tillgängligt i köket.
          </p>
        </header>

        {usingFallback && (
          <div className="bg-amber-950/60 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Observera (Demoläge):</span> Supabase är inte anslutet. Ändringar sparas i lokal vy. För att spara i molnet permanent, ställ in `NEXT_PUBLIC_SUPABASE_URL` och kör `supabase-schema.sql`!
            </div>
          </div>
        )}

        {/* ➕ Lägg till ny rätt (Add item form) */}
        <section className="pinchos-glass-card rounded-2xl p-6 border border-amber-500/30 shadow-xl">
          <h2 className="text-xl font-black text-amber-400 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" /> Lägg till ny rätt på cirkusmenyn
          </h2>

          <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">Titel & Emoji</label>
              <input
                type="text"
                required
                placeholder="t.ex. Mini Taco Smash 🌮"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-900 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="bg-slate-900 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="Smårätter">Smårätter 🍔</option>
                <option value="Candy Drinks">Candy Drinks 🍹</option>
                <option value="Dessert">Dessert 🍨</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-300">Beskrivning</label>
              <textarea
                rows={2}
                placeholder="Kort och smarrig beskrivning av rätten..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-slate-900 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">Pris (SEK)</label>
              <input
                type="number"
                required
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="bg-slate-900 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-200">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                />
                 Tillgänglig direkt för beställning
              </label>
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl shadow-gold-glow transition-all active:scale-95 text-sm uppercase tracking-wide flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                Spara & Publicera Rätt
              </button>
            </div>
          </form>
        </section>

        {/* 📋 Alla Menyobjekt (List & Toggle status) */}
        <section className="pinchos-glass-card rounded-2xl p-6 border border-amber-500/30 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-amber-500/20 pb-3">
            <h2 className="text-xl font-black text-amber-400 flex items-center gap-2">
              <Utensils className="w-5 h-5" /> Aktuell Meny ({items.length} rätter)
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400">Laddar menylista...</div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`bg-slate-900/90 rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    item.available ? 'border-amber-500/20' : 'border-rose-900/40 opacity-60'
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-base">{item.title}</span>
                      <span className="text-xs bg-slate-950 px-2 py-0.5 rounded border border-amber-500/30 text-amber-300 font-medium">
                        {item.category}
                      </span>
                      <span className="text-xs text-amber-400 font-bold">{item.price} SEK</span>
                    </div>
                    <p className="text-xs text-slate-400">{item.description}</p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleToggleAvailable(item.id, item.available)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        item.available
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                          : 'bg-rose-950/80 text-rose-300 border-rose-500/60'
                      }`}
                    >
                      {item.available ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{item.available ? 'Tillgänglig' : 'Slut (Ej i lager)'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 rounded-xl border border-rose-900/40 transition-colors"
                      title="Ta bort"
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
    </div>
  );
}
