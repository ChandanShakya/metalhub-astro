interface AbortControllerCtx {
    id: number;
    abort: AbortController | null;
}

interface Window {
    __saveCustomerLocation?: () => void;
    __cartUpdateQty?: (index: number, qty: number) => void;
    __cartRemoveItem?: (index: number) => void;
    __cartClearAll?: () => void;
    __productsCtx: AbortControllerCtx;
    __galleryCtx: AbortControllerCtx;
    __attrCtx: AbortControllerCtx;
    __orderCtx: AbortControllerCtx;
    __cartCtx: AbortControllerCtx;
    __headerCtx: AbortControllerCtx;
    __socialLoaded: boolean;
    fbAsyncInit?: () => void;
}

declare const FB: {
    init: (params: { xfbml: boolean; version: string }) => void;
};

declare const instgrm: {
    Embeds: { process: () => void };
};

declare namespace tiktok {
    function embed(): void;
}
