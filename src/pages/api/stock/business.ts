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

        const settings = await getCollection("settings");
        const site = settings[0]?.data;

        return new Response(JSON.stringify({ settings: site }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch {
        return new Response(JSON.stringify({ error: "Failed to fetch settings" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { password, ...settingsData } = body;

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

        const filePath = "src/content/settings/site.md";
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
        const sha = fileData.sha;

        const frontmatterEntries = Object.entries(settingsData)
            .map(([key, value]) => {
                if (typeof value === "string" && value.includes("\n")) {
                    return `${key}:\n  ${value.split("\n").join("\n  ")}`;
                }
                return `${key}: ${JSON.stringify(value)}`;
            })
            .join("\n");

        const newContent = `---\n${frontmatterEntries}\n---\n`;
        const updatedBase64 = btoa(newContent);

        const putResponse = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "Update site settings",
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
        return new Response(JSON.stringify({ error: "Failed to update settings", details: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
