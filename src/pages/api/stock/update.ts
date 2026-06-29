import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { password, slug, stock, variantKey } = body;

        const adminPassword = import.meta.env.ADMIN_PASSWORD;
        const githubToken = import.meta.env.GITHUB_TOKEN;

        if (!adminPassword || password !== adminPassword) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!githubToken) {
            return new Response(JSON.stringify({ error: "GitHub token not configured" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!slug || stock === undefined) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const filePath = `src/content/products/${slug}.md`;
        const apiUrl = `https://api.github.com/repos/ChandanShakya/metalhub-astro/contents/${filePath}`;

        const getResponse = await fetch(apiUrl, {
            headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (!getResponse.ok) {
            return new Response(JSON.stringify({ error: "Failed to fetch file" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        const fileData = await getResponse.json();
        const content = atob(fileData.content);
        const sha = fileData.sha;

        const stockStr = String(stock);

        let updatedContent: string;
        if (variantKey) {
            const variantRegex = new RegExp(`(- key: ${variantKey}[\\s\\S]*?stock:)\\s*\\d+`);
            updatedContent = content.replace(variantRegex, `$1 ${stockStr}`);
        } else {
            updatedContent = content.replace(/^(stock:)\s*\d+/m, `$1 ${stockStr}`);
        }

        const updatedBase64 = btoa(updatedContent);

        const putResponse = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: `Update stock for ${slug}${variantKey ? ` variant ${variantKey}` : ""}: ${stockStr}`,
                content: updatedBase64,
                sha: sha,
                branch: "main",
            }),
        });

        if (!putResponse.ok) {
            const errorData = await putResponse.json();
            return new Response(JSON.stringify({ error: "Failed to update file", details: errorData }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Failed to update stock", details: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
