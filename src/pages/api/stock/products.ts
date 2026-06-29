import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const password = url.searchParams.get("password");

        const adminPassword = import.meta.env.ADMIN_PASSWORD;
        if (!adminPassword || password !== adminPassword) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const products = await getCollection("products");
        const productData = products.map((p) => ({
            slug: p.data.slug,
            name: p.data.name,
            category: p.data.category,
            material: p.data.material,
            basePrice: p.data.basePrice,
            stock: p.data.stock,
            inStock: p.data.inStock,
            featured: p.data.featured,
            discount: p.data.discount,
            variants: p.data.variants.map((v) => ({
                key: v.key,
                stock: v.stock,
                inStock: v.inStock,
                priceModifier: v.priceModifier,
                discount: v.discount,
            })),
        }));

        return new Response(JSON.stringify({ products: productData }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch {
        return new Response(JSON.stringify({ error: "Failed to fetch products" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
