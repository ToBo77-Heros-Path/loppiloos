import { createClient } from '@supabase/supabase-js';
import { MenuItem } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  );
};

// Initial mock menu items used when Supabase is not connected
export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  // Smårätter
  {
    id: '1',
    title: 'Mini Cheeseburger 🍔',
    description: 'Saftig högrevsburgare med smält cheddar, karamelliserad lök och Loppiloos hemliga cirkussås.',
    category: 'Smårätter',
    price: 38,
    available: true,
  },
  {
    id: '2',
    title: 'Crispy Halloumi Sticks 🧀',
    description: 'Krispiga halloumistavar serverade med sötstark chilimajonnäs.',
    category: 'Smårätter',
    price: 34,
    available: true,
  },
  {
    id: '3',
    title: 'Sötpotatispommes 🍟',
    description: 'Frasiga sötpotatisstrips kryddade med havssalt och tryffelmajo.',
    category: 'Smårätter',
    price: 32,
    available: true,
  },
  {
    id: '4',
    title: 'Tacos de Carne 🌮',
    description: 'Små majstacos fyllda med långkokt högrev, picklad rödlök och färsk koriander.',
    category: 'Smårätter',
    price: 36,
    available: true,
  },
  {
    id: '5',
    title: 'Buffalo Chicken Bites 🍗',
    description: 'Panerade kycklingbitar täckta i rökig glasyr med ädelostdipp.',
    category: 'Smårätter',
    price: 38,
    available: true,
  },
  {
    id: '6',
    title: 'Quesadillas Triple Cheese 🧀',
    description: 'Varma majstortillas fyllda med gouda, cheddar och jalapeños.',
    category: 'Smårätter',
    price: 34,
    available: true,
  },

  // Candy Drinks
  {
    id: '7',
    title: 'Fizz Wiz Bubblegum 🍬',
    description: 'En magisk cirkusdrink med smak av tuggummi, sodavatten och popup-godis på kanten.',
    category: 'Candy Drinks',
    price: 42,
    available: true,
  },
  {
    id: '8',
    title: 'Sur S-Märke Splash 🍋',
    description: 'Syrlig och uppfriskande drink med smak av surt citron- och hallongodis.',
    category: 'Candy Drinks',
    price: 45,
    available: true,
  },
  {
    id: '9',
    title: 'Ahlgrens Bilar Fizz 🚘',
    description: 'Rosa drömdrink toppad med skumgummibilar och ett stänk av lime.',
    category: 'Candy Drinks',
    price: 42,
    available: true,
  },
  {
    id: '10',
    title: 'Watermelon Sugar High 🍉',
    description: 'Söt vattenmelonnektar med kolsyra och vattenmelonsvampar.',
    category: 'Candy Drinks',
    price: 39,
    available: true,
  },
  {
    id: '11',
    title: 'Cirque Du Cola 🎪',
    description: 'Klassisk cola serverad i ett cirkusglas med maraschino-körsbär och sugrör.',
    category: 'Candy Drinks',
    price: 28,
    available: true,
  },

  // Dessert
  {
    id: '12',
    title: 'Churros med Nutella 🍫',
    description: 'Varma, nystekta churros rullade i kanelsocker med varm Nutelladipp.',
    category: 'Dessert',
    price: 38,
    available: true,
  },
  {
    id: '13',
    title: 'Mini Marängswiss 🍨',
    description: 'Vaniljglass, vispad grädde, bananskivor, maränger och varm chokladsås.',
    category: 'Dessert',
    price: 35,
    available: true,
  },
  {
    id: '14',
    title: 'Popcorn Caramel Sundae 🍿',
    description: 'Krämig kolaglass toppad med salta popcorn och karamellsås.',
    category: 'Dessert',
    price: 36,
    available: true,
  },
  {
    id: '15',
    title: 'Nutella Pizza Slice 🍕',
    description: 'Varmt mini-tunnbröd täckt med Nutella, jordgubbar och florsocker.',
    category: 'Dessert',
    price: 38,
    available: true,
  },
];
