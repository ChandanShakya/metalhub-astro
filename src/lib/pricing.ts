export interface PriceDiscount {
  active: boolean;
  type: 'percentage' | 'flat';
  value: number;
}

export interface PriceResult {
  basePrice: number;
  discountedPrice: number;
  originalPrice: number;
  hasDiscount: boolean;
  discountLabel: string;
}

export function calculatePrice(
  basePrice: number,
  selectedModifiers: number[],
  productDiscount: PriceDiscount,
  optionDiscounts: (PriceDiscount | undefined)[]
): PriceResult {
  let totalModifiers = 0;
  for (const m of selectedModifiers) {
    totalModifiers += m;
  }

  const priceWithModifiers = basePrice + totalModifiers;

  let bestDiscount: PriceDiscount | null = null;

  for (const od of optionDiscounts) {
    if (od?.active) {
      if (!bestDiscount || isBetterDiscount(od, bestDiscount)) {
        bestDiscount = od;
      }
    }
  }

  if (!bestDiscount && productDiscount.active) {
    bestDiscount = productDiscount;
  }

  if (!bestDiscount) {
    return {
      basePrice: priceWithModifiers,
      discountedPrice: priceWithModifiers,
      originalPrice: priceWithModifiers,
      hasDiscount: false,
      discountLabel: ''
    };
  }

  const discounted = applyDiscount(priceWithModifiers, bestDiscount);
  const label = bestDiscount.type === 'percentage'
    ? `${bestDiscount.value}% off`
    : `NPR ${bestDiscount.value} off`;

  return {
    basePrice: priceWithModifiers,
    discountedPrice: discounted,
    originalPrice: priceWithModifiers,
    hasDiscount: true,
    discountLabel: label
  };
}

function applyDiscount(price: number, discount: PriceDiscount): number {
  if (discount.type === 'percentage') {
    return Math.round(price * (1 - discount.value / 100));
  }
  return Math.max(0, price - discount.value);
}

function isBetterDiscount(a: PriceDiscount, b: PriceDiscount): boolean {
  return a.value > b.value;
}

export function formatPrice(amount: number): string {
  return `NPR ${amount.toLocaleString()}`;
}
