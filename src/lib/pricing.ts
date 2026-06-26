interface PriceDiscount {
    active: boolean;
    type: "percentage" | "flat";
    value: number;
}

interface PriceResult {
    basePrice: number;
    discountedPrice: number;
    originalPrice: number;
    hasDiscount: boolean;
    discountLabel: string;
}

interface AttributeValue {
    group: string;
    option: string;
}

interface Variant {
    key: string;
    attributeValues: AttributeValue[];
    priceModifier: number;
    discount: PriceDiscount;
    images?: string[];
    stock: number;
    inStock: boolean;
}

interface AttributeOption {
    label: Record<string, string>;
}

interface AttributeGroup {
    name: Record<string, string>;
    options: AttributeOption[];
}

export function resolveAttributeLabels(
    attributeGroups: AttributeGroup[],
    locale: string,
    attributeValues: AttributeValue[],
): Record<string, string> {
    const labels: Record<string, string> = {};
    for (const av of attributeValues) {
        const group = attributeGroups.find((g) => g.name.en === av.group);
        if (group) {
            const option = group.options.find((o) => o.label.en === av.option);
            labels[av.group] = option ? option.label[locale] || option.label.en : av.option;
        } else {
            labels[av.group] = av.option;
        }
    }
    return labels;
}

export interface CategoryStats {
    productCount: number;
    materialCount: number;
    variantCount: number;
    totalStock: number;
    materials: string[];
}

interface SaleItem {
    product: {
        slug: string;
        name: Record<string, string>;
        image: string;
        category: string;
        material: string;
    };
    variantKey: string | null;
    attributeLabels: Record<string, string> | null;
    price: number;
    originalPrice: number;
    hasDiscount: boolean;
    discountLabel: string;
    linkParams: string;
    stock: number;
}

function applyDiscount(price: number, discount: PriceDiscount): number {
    if (discount.type === "percentage") {
        return Math.round(price * (1 - discount.value / 100));
    }
    return Math.max(0, price - discount.value);
}

export function formatPrice(amount: number): string {
    return `NPR ${amount.toLocaleString()}`;
}

export function calculateVariantPrice(basePrice: number, variant: Variant): PriceResult {
    const total = basePrice + variant.priceModifier;

    if (variant.discount.active) {
        const discounted = applyDiscount(total, variant.discount);
        const label =
            variant.discount.type === "percentage"
                ? `${variant.discount.value}% off`
                : `NPR ${variant.discount.value} off`;
        return {
            basePrice: total,
            discountedPrice: discounted,
            originalPrice: total,
            hasDiscount: true,
            discountLabel: label,
        };
    }

    return {
        basePrice: total,
        discountedPrice: total,
        originalPrice: total,
        hasDiscount: false,
        discountLabel: "",
    };
}

export function findMatchingVariant(selectedOptions: Record<string, string>, variants: Variant[]): Variant | undefined {
    return variants.find((v) => v.attributeValues.every((av) => selectedOptions[av.group] === av.option));
}

export function getAvailableOptions(
    selectedOptions: Record<string, string>,
    variants: Variant[],
    groupName: string,
): Set<string> {
    const available = new Set<string>();
    for (const v of variants) {
        let matches = true;
        for (const av of v.attributeValues) {
            if (av.group !== groupName && selectedOptions[av.group] && selectedOptions[av.group] !== av.option) {
                matches = false;
                break;
            }
        }
        if (matches) {
            const opt = v.attributeValues.find((av) => av.group === groupName);
            if (opt) available.add(opt.option);
        }
    }
    return available;
}

export function buildVariantParams(attributeValues: AttributeValue[]): string {
    const params = new URLSearchParams();
    for (const av of attributeValues) {
        params.set(av.group, av.option);
    }
    return params.toString();
}

export function getItemStock(
    product: { data: { stock: number; variants: Variant[] } },
    variant?: Variant | null,
): number {
    if (variant) return variant.stock ?? 0;
    if (product.data.variants && product.data.variants.length > 0) return 0;
    return product.data.stock ?? 0;
}

export function getCategoryStats(
    products: Array<{ data: { category: string; material: string; stock: number; variants: Variant[] } }>,
): Map<string, CategoryStats> {
    const stats = new Map<string, CategoryStats>();

    for (const p of products) {
        const cat = p.data.category;
        if (!stats.has(cat)) {
            stats.set(cat, { productCount: 0, materialCount: 0, variantCount: 0, totalStock: 0, materials: [] });
        }
        const s = stats.get(cat)!;
        s.productCount++;
        if (!s.materials.includes(p.data.material)) {
            s.materials.push(p.data.material);
            s.materialCount = s.materials.length;
        }
        if (p.data.variants && p.data.variants.length > 0) {
            s.variantCount += p.data.variants.length;
            s.totalStock += p.data.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
        } else {
            s.totalStock += p.data.stock ?? 0;
        }
    }

    return stats;
}

export function getSaleVariants(
    products: Array<{
        data: {
            slug: string;
            name: Record<string, string>;
            images: string[];
            category: string;
            material: string;
            basePrice: number;
            discount: PriceDiscount;
            variants: Variant[];
            attributeGroups?: AttributeGroup[];
            stock: number;
        };
    }>,
    locale: string,
): SaleItem[] {
    const results: SaleItem[] = [];

    for (const product of products) {
        const d = product.data;
        const image = d.images[0] || "";

        if (d.discount.active) {
            const discounted = applyDiscount(d.basePrice, d.discount);
            const label = d.discount.type === "percentage" ? `${d.discount.value}% off` : `NPR ${d.discount.value} off`;
            results.push({
                product: { slug: d.slug, name: d.name, image, category: d.category, material: d.material },
                variantKey: null,
                attributeLabels: null,
                price: discounted,
                originalPrice: d.basePrice,
                hasDiscount: true,
                discountLabel: label,
                linkParams: "",
                stock: d.stock ?? 0,
            });
        }

        for (const variant of d.variants) {
            if (variant.discount.active) {
                const totalPrice = d.basePrice + variant.priceModifier;
                const discounted = applyDiscount(totalPrice, variant.discount);
                const labels = d.attributeGroups
                    ? resolveAttributeLabels(d.attributeGroups, locale, variant.attributeValues)
                    : {};
                const label =
                    variant.discount.type === "percentage"
                        ? `${variant.discount.value}% off`
                        : `NPR ${variant.discount.value} off`;
                results.push({
                    product: { slug: d.slug, name: d.name, image, category: d.category, material: d.material },
                    variantKey: variant.key,
                    attributeLabels: labels,
                    price: discounted,
                    originalPrice: totalPrice,
                    hasDiscount: true,
                    discountLabel: label,
                    linkParams: buildVariantParams(variant.attributeValues),
                    stock: variant.stock ?? 0,
                });
            }
        }
    }

    return results.sort((a, b) => a.price - b.price);
}

export interface PriceRangeResult {
    price: number;
    originalPrice: number;
    hasDiscount: boolean;
    discountLabel: string;
    cheapestVariantParams: string;
}

export function getProductPriceRange(
    basePrice: number,
    variants: Variant[],
    productDiscount: PriceDiscount,
): PriceRangeResult {
    if (!variants || variants.length === 0) {
        const discounted = productDiscount.active ? applyDiscount(basePrice, productDiscount) : basePrice;
        const label = productDiscount.active
            ? productDiscount.type === "percentage"
                ? `${productDiscount.value}% off`
                : `NPR ${productDiscount.value} off`
            : "";
        return {
            price: discounted,
            originalPrice: basePrice,
            hasDiscount: productDiscount.active,
            discountLabel: label,
            cheapestVariantParams: "",
        };
    }

    let cheapestPrice = Infinity;
    let cheapestOriginal = Infinity;
    let hasDiscount = false;
    let discountLabel = "";
    let cheapestVariant: Variant | null = null;

    for (const v of variants) {
        const total = basePrice + v.priceModifier;
        if (v.discount?.active) {
            const discounted = applyDiscount(total, v.discount);
            if (discounted < cheapestPrice) {
                cheapestPrice = discounted;
                cheapestOriginal = total;
                cheapestVariant = v;
            }
            hasDiscount = true;
            discountLabel =
                v.discount.type === "percentage" ? `${v.discount.value}% off` : `NPR ${v.discount.value} off`;
        } else {
            if (total < cheapestPrice) {
                cheapestPrice = total;
                cheapestOriginal = total;
                cheapestVariant = v;
            }
        }
    }

    return {
        price: cheapestPrice,
        originalPrice: cheapestOriginal,
        hasDiscount,
        discountLabel,
        cheapestVariantParams: cheapestVariant ? buildVariantParams(cheapestVariant.attributeValues) : "",
    };
}
