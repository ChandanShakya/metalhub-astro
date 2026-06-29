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

        const pages = await getCollection("infoPages");
        const pageData = pages.map((p) => ({
            slug: p.data.slug,
            title: p.data.title,
            order: p.data.order,
        }));

        return new Response(JSON.stringify({ pages: pageData }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch {
        return new Response(JSON.stringify({ error: "Failed to fetch pages" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
