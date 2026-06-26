export const CART_KEY = "metalhub-cart";
export const CUSTOMER_KEY = "metalhub-customer";

export function getLocale(): string {
    var m = window.location.pathname.match(/^\/(ne|newa)\//);
    return m ? m[1] : "en";
}

export function getCart(): any[] {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
        return [];
    }
}

export function saveCart(items: any[]): void {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("cart-updated"));
}

export function translateLabel(key: string, labels: Record<string, string>): string {
    return (labels && labels[key]) || key;
}

export function localizeName(obj: Record<string, string>, locale: string): string {
    return obj[locale] || obj.en;
}
