export interface CartItem {
  slug: string;
  name: string;
  selectedOptions: Record<string, string>;
  selectedModifiers: number[];
  unitPrice: number;
  originalUnitPrice: number;
  hasDiscount: boolean;
  qty: number;
}

const CART_KEY = 'metalhub-cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(item: CartItem): CartItem[] {
  const cart = getCart();
  const existingIndex = cart.findIndex(
    (c) => c.slug === item.slug && JSON.stringify(c.selectedOptions) === JSON.stringify(item.selectedOptions)
  );

  if (existingIndex >= 0) {
    cart[existingIndex].qty += item.qty;
  } else {
    cart.push(item);
  }

  saveCart(cart);
  return cart;
}

export function removeFromCart(slug: string, selectedOptions: Record<string, string>): CartItem[] {
  const cart = getCart().filter(
    (c) => !(c.slug === slug && JSON.stringify(c.selectedOptions) === JSON.stringify(selectedOptions))
  );
  saveCart(cart);
  return cart;
}

export function updateQuantity(slug: string, selectedOptions: Record<string, string>, qty: number): CartItem[] {
  const cart = getCart();
  const item = cart.find(
    (c) => c.slug === slug && JSON.stringify(c.selectedOptions) === JSON.stringify(selectedOptions)
  );
  if (item) {
    item.qty = Math.max(1, qty);
  }
  saveCart(cart);
  return cart;
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
}
