
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  shoppingLinks?: string[];
}

export interface Message {
  id: number;
  content: string;
  isOutgoing: boolean;
  sender?: string;
  type?: 'text' | 'product' | 'question';
  options?: string[];
  product?: Product;
}
