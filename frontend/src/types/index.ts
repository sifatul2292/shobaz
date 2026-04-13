export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  images?: string[];
  videoUrl?: string;
  price: number;
  salePrice?: number;
  discountAmount?: number;
  discountType?: number;
  stock?: number;
  quantity?: number;
  author?: Author | string;
  publisher?: Publisher | string;
  category?: Category;
  subCategory?: Category;
  status?: string;
  createdAt?: string;
  previewPdfUrl?: string;
  pdfFile?: string;
  features?: string[];
  specifications?: Record<string, string>;
  edition?: string;
  totalPages?: number;
  weight?: string;
  language?: string;
  country?: string;
  ratingAvr?: number;
  ratingCount?: number;
  ratingTotal?: number;
  ratingDetails?: { stars: number; count: number }[];
  reviews?: Review[];
  boughtTogether?: Product[];
  boughtTogetherProducts?: Product[];
  bundleDiscount?: number;
}

export interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    profileImg?: string;
  };
  product: {
    _id: string;
    name: string;
    images?: string[];
    slug?: string;
  };
  rating: number;
  review: string;
  reviewDate?: string;
  createdAt?: string;
  status?: boolean;
  isReview?: boolean;
  reply?: string;
  replyDate?: string;
}

export interface Author {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  bio?: string;
}

export interface Publisher {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
}

export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface Order {
  _id: string;
  orderId: string;
  user: User;
  items: CartItem[];
  totalAmount: number;
  shippingCost: number;
  discount: number;
  status: string;
  shippingAddress: Address;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

export interface Address {
  name: string;
  phone: string;
  address: string;
  area?: string;
  city?: string;
}

export interface ShopInfo {
  siteName?: string;
  siteLogo?: string;
  navLogo?: string;
  phone?: string;
  email?: string;
  address?: string;
  facebook?: string;
  youtube?: string;
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  image?: string;
  author?: string;
  createdAt?: string;
}

export interface Page {
  _id: string;
  title: string;
  slug: string;
  content: string;
  status?: string;
}

export interface Tag {
  _id: string;
  name: string;
  slug?: string;
}

export interface ShippingCharge {
  _id?: string;
  deliveryInDhaka: number;
  deliveryOutsideDhaka: number;
  deliveryOutsideBD?: number;
}