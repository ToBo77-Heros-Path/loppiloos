-- =========================================================
-- Loppiloo's 🎪 Pinchos Database Schema & Seed Data
-- Run this script in the Supabase SQL Editor
-- =========================================================

-- 1. Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Smårätter', 'Candy Drinks', 'Dessert')),
  price INTEGER NOT NULL DEFAULT 35,
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_name TEXT NOT NULL,
  items JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'Inkommen' CHECK (status IN ('Inkommen', 'Klar')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security (RLS) & Add Public Policies for Home Use
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow public read access to menu_items
CREATE POLICY "Public read menu_items" ON public.menu_items
  FOR SELECT USING (true);

-- Allow public insert/update/delete to menu_items for admin view
CREATE POLICY "Public write menu_items" ON public.menu_items
  FOR ALL USING (true) WITH CHECK (true);

-- Allow public read/write to orders
CREATE POLICY "Public read/write orders" ON public.orders
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Enable Supabase Realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 5. Seed initial menu items for Loppiloo's Pinchos
INSERT INTO public.menu_items (title, description, category, price, available)
VALUES
  -- Smårätter
  ('Mini Cheeseburger', 'Saftig högrevsburgare med smält cheddar, karamelliserad lök och Loppiloos hemliga cirkussås.', 'Smårätter', 38, true),
  ('Crispy Halloumi Sticks', 'Krispiga halloumistavar serverade med sötstark chilimajonnäs.', 'Smårätter', 34, true),
  ('Sötpotatispommes', 'Frasiga sötpotatisstrips kryddade med havssalt och tryffelmajo.', 'Smårätter', 32, true),
  ('Tacos de Carne', 'Små majstacos fyllda med långkokt högrev, picklad rödlök och färsk koriander.', 'Smårätter', 36, true),
  ('Buffalo Chicken Bites', 'Panerade kycklingbitar täckta i rökig glasyr med ädelostdipp.', 'Smårätter', 38, true),
  ('Quesadillas Triple Cheese', 'Varma majstortillas fyllda med gouda, cheddar och jalapeños.', 'Smårätter', 34, true),

  -- Candy Drinks
  ('Fizz Wiz Bubblegum 🍬', 'En magisk cirkusdrink med smak av tuggummi, sodavatten och popup-godis på kanten.', 'Candy Drinks', 42, true),
  ('Sur S-Märke Splash 🍋', 'Syrlig och uppfriskande drink med smak av surt citron- och hallongodis.', 'Candy Drinks', 45, true),
  ('Ahlgrens Bilar Fizz 🚘', 'Rosa drömdrink toppad med skumgummibilar och ett stänk av lime.', 'Candy Drinks', 42, true),
  ('Watermelon Sugar High 🍉', 'Söt vattenmelonnektar med kolsyra och vattenmelonsvampar.', 'Candy Drinks', 39, true),
  ('Cirque Du Cola 🎪', 'Klassisk cola serverad i ett cirkusglas med maraschino-körsbär och sugrör.', 'Candy Drinks', 28, true),

  -- Dessert
  ('Churros med Nutella 🍫', 'Varma, nystekta churros rullade i kanelsocker med varm Nutelladipp.', 'Dessert', 38, true),
  ('Mini Marängswiss 🍨', 'Vaniljglass, vispad grädde, bananskivor, maränger och varm chokladsås.', 'Dessert', 35, true),
  ('Popcorn Caramel Sundae 🍿', 'Krämig kolaglass toppad med salta popcorn och karamellsås.', 'Dessert', 36, true),
  ('Nutella Pizza Slice 🍕', 'Varmt mini-tunnbröd täckt med Nutella, jordgubbar och florsocker.', 'Dessert', 38, true);
