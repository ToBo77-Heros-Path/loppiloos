'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MenuItem, CategoryType } from '@/types/database';
import { Plus, Trash2, Check, X, Utensils } from 'lucide-react';

export default function AdminPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for adding new item
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryType>('Smårätter');
  const [isAvailable, setIsAvailable] = useState(true);

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
        console.error('Error fetching admin menu items:', error);
        setItems([]);
      } else {
        const list = (data || []) as MenuItem[];
        list.sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return 0;
        });
        setItems(list);
      }
    } catch (err) {
      console.error('Error fetching admin menu items:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formTitle = title.trim();
    const formCategory = category;
    const formDescription = description.trim();

    const { data, error } = await supabase.from('menu_items').insert([
      {
        title: formTitle,
        category: formCategory,
        description: formDescription,
        available: isAvailable,
      }
    ]).select();

    if (error) {
      alert('Kunde inte spara i Supabase: ' + error.message);
    } else {
      if (data && data.length > 0) {
        setItems((prev) => [data[0] as MenuItem, ...prev]);
      }
      // Ladda om menylistan från Supabase
      fetchMenuItems();
    }

    // Reset form
    setTitle('');
    setDescription('');
    setIsAvailable(true);
  };

  const handleToggleAvailable = async (id: string, currentAvailable: boolean) => {
    const nextAvailable = !currentAvailable;
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, available: nextAvailable } : i))
    );

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ available: nextAvailable })
        .eq('id', id);

      if (error) {
        console.error('Failed toggling availability:', error);
      }
    } catch (err) {
      console.error('Failed toggling availability:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna rätt permanent?')) return;

    const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
    if (error) {
      alert('Kunde inte ta bort i Supabase: ' + error.message);
    } else {
      fetchMenuItems();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFD3DD] via-[#F0F9F8] to-[#C6E6E3] text-[#2D3748] flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#F3A2BE] via-[#FFD3DD] to-[#F3A2BE] rounded-3xl p-6 border-4 border-[#81BFB7] text-center shadow-lg flex flex-col items-center gap-3">
          <div className="bg-[#1e293b] px-6 py-2 rounded-2xl border-2 border-[#81BFB7] shadow-[0_0_15px_rgba(243,162,190,0.6)] animate-neon-flicker">
            <h1 className="text-3xl sm:text-4xl diner-neon-text tracking-wide" style={{ textShadow: '0 0 10px #F3A2BE, 0 0 20px #F3A2BE, 0 0 30px #e11d48' }}>
              Loppiloo's Admin
            </h1>
          </div>
          <p className="text-[#4F8881] text-xs sm:text-sm font-bold bg-[#F0F9F8]/90 px-4 py-1 rounded-full border border-[#81BFB7]/40">
            🍿 LOPPILOO'S PARTY DINER 🍿 | Hantera rätter & tillgänglighet
          </p>
        </header>

        {/* ➕ Lägg till ny rätt (Add item form) */}
        <section className="diner-glass-card rounded-3xl p-6 border-2 border-[#81BFB7]/40 shadow-diner-card">
          <h2 className="text-xl font-black text-[#2D3748] mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#F3A2BE] stroke-[3]" /> Lägg till ny rätt på menyn
          </h2>

          <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#4F8881]">Titel & Emoji</label>
              <input
                type="text"
                required
                placeholder="t.ex. Mini Taco Smash 🌮"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white border-2 border-[#C6E6E3] rounded-2xl px-4 py-2.5 text-sm text-[#2D3748] placeholder-[#81BFB7] focus:outline-none focus:border-[#81BFB7]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#4F8881]">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
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
                placeholder="Kort och smarrig beskrivning av rätten..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white border-2 border-[#C6E6E3] rounded-2xl px-4 py-2.5 text-sm text-[#2D3748] placeholder-[#81BFB7] focus:outline-none focus:border-[#81BFB7]"
              />
            </div>

            <div className="flex items-center gap-3 pt-4 md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-extrabold text-[#2D3748]">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-5 h-5 rounded accent-[#F3A2BE] cursor-pointer"
                />
                 Tillgänglig direkt för beställning
              </label>
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                className="w-full bg-[#F3A2BE] hover:bg-[#e11d48] text-white font-black py-3.5 rounded-2xl shadow-md transition-all active:scale-95 text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                Spara & Publicera Rätt
              </button>
            </div>
          </form>
        </section>

        {/* 📋 Alla Menyobjekt (List & Toggle status) */}
        <section className="diner-glass-card rounded-3xl p-6 border-2 border-[#81BFB7]/40 shadow-diner-card space-y-4">
          <div className="flex justify-between items-center border-b-2 border-[#81BFB7]/30 pb-3">
            <h2 className="text-xl font-black text-[#2D3748] flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[#81BFB7]" /> Aktuell Meny ({items.length} rätter)
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8 text-[#4F8881]">Laddar menylista...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-[#4F8881] font-bold">Inga rätter tillagda än. Lägg till rätter via Admin!</div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
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

                  {/* Controls */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => handleToggleAvailable(item.id, item.available)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black border-2 transition-all flex items-center gap-1.5 ${
                        item.available
                          ? 'bg-[#C6E6E3] text-[#4F8881] border-[#81BFB7]'
                          : 'bg-[#FFD3DD] text-[#e11d48] border-[#F3A2BE]'
                      }`}
                    >
                      {item.available ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4 stroke-[3]" />}
                      <span>{item.available ? 'Tillgänglig' : 'Slut (Ej i lager)'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-[#e11d48] hover:bg-[#FFD3DD] rounded-xl border border-[#F3A2BE] transition-colors"
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
