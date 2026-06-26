import type { APIRoute } from "astro";
import manifest from "../../data/og-manifest.json";

export const prerender = false;

const SITE_URL = "https://metalhub.com.np";
const DEFAULT_OG = "/images/og-default.jpg";

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const product = url.searchParams.get("product");
    const variant = url.searchParams.get("variant");

    let imagePath = DEFAULT_OG;

    if (product && manifest[product as keyof typeof manifest]) {
        const productData = manifest[product as keyof typeof manifest];

        if (variant && productData.variants[variant]?.images?.length > 0) {
            imagePath = productData.variants[variant].images[0];
        } else if (productData.images?.length > 0) {
            imagePath = productData.images[0];
        }
    }

    return new Response(null, {
        status: 302,
        headers: {
            Location: `${SITE_URL}${imagePath}`,
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    });
};
