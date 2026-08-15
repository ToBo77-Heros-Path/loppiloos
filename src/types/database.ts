export type CategoryType = 
  | 'Smårätter' 
  | 'Candy Drinks' 
  | 'Bygg din Tårta' 
  | 'Dessert'
  | 'Tårta - Botten'
  | 'Tårta - Fyllning'
  | 'Tårta - Topping';

export interface CakeDetails {
  base: string;
  fillings: string[];
  toppings: string[];
}

export interface MenuItem {
  id: string;
  title: string;
  description: string;
  category: CategoryType;
  price: number;
  image_url?: string;
  available: boolean;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  title?: string;
  name?: string;
  item_title?: string;
  quantity?: number;
  qty?: number;
  count?: number;
  price?: number;
  category?: CategoryType;
  cake_details?: CakeDetails;
}

export interface Order {
  id: string;
  guest_name: string;
  items: OrderItem[] | string | any;
  status: 'Inkommen' | 'Klar';
  created_at: string;
}
