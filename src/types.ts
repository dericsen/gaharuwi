export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  origin: string;
  steepTime: string;
  temperature: string;
  stock: number;
  rating: number;
  reviewCount: number;
}

export interface CartItem extends Product {
  quantity: number;
}
