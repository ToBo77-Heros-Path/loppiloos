export type CategoryType = 'Smårätter' | 'Candy Drinks' | 'Dessert';

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
  id: string;
  title: string;
  quantity: number;
  price: number;
  category: CategoryType;
}

export interface Order {
  id: string;
  guest_name: string;
  items: OrderItem[];
  status: 'Inkommen' | 'Klar';
  created_at: string;
}
