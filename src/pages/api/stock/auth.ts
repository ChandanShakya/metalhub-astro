import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { password } = body;

        const adminPassword = import.meta.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            return new Response(JSON.stringify({ error: "Admin password not configured" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (password === adminPassword) {
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ error: "Invalid password" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    } catch {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
};
