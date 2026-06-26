declare const FB: { init: (params: { xfbml: boolean; version: string }) => void };
declare const instgrm: { Embeds: { process: () => void } };
declare namespace tiktok {
    function embed(): void;
}

const SDK_SCRIPTS: Record<string, { src: string; global: string; setup?: () => void }> = {
    facebook: {
        src: "https://connect.facebook.net/en_US/sdk.js",
        global: "FB",
        setup: () => {
            (window as any).fbAsyncInit = () => {
                try {
                    FB.init({ xfbml: true, version: "v19.0" });
                } catch {}
            };
        },
    },
    instagram: {
        src: "https://www.instagram.com/embed.js",
        global: "instgrm",
    },
    tiktok: {
        src: "https://www.tiktok.com/embed.js",
        global: "tiktok",
    },
};

function clearGlobal(name: string): void {
    try {
        (window as any)[name] = undefined;
    } catch {}
    try {
        delete (window as any)[name];
    } catch {}
}

function removeOldScript(srcMatch: string): void {
    const old = document.querySelector(`script[src*="${srcMatch}"]`);
    if (old) old.remove();
}

export function loadFacebookSDK(onReady?: () => void): void {
    const cfg = SDK_SCRIPTS.facebook;
    clearGlobal(cfg.global);
    removeOldScript("connect.facebook.net");
    cfg.setup?.();
    const s = document.createElement("script");
    s.src = cfg.src;
    s.async = true;
    s.onload = () => onReady?.();
    document.head.appendChild(s);
}

export function loadInstagramSDK(onReady?: () => void): void {
    const cfg = SDK_SCRIPTS.instagram;
    clearGlobal(cfg.global);
    removeOldScript("instagram.com/embed.js");
    const s = document.createElement("script");
    s.src = cfg.src;
    s.async = true;
    s.onload = () => onReady?.();
    document.head.appendChild(s);
}

export function loadTikTokSDK(onReady?: () => void): void {
    const cfg = SDK_SCRIPTS.tiktok;
    clearGlobal(cfg.global);
    removeOldScript("tiktok.com/embed.js");
    const s = document.createElement("script");
    s.src = cfg.src;
    s.async = true;
    s.onload = () => onReady?.();
    document.head.appendChild(s);
}
