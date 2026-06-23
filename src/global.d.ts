interface Window {
    __saveCustomerLocation?: () => void;
    __cartUpdateQty?: (index: number, qty: number) => void;
    __cartRemoveItem?: (index: number) => void;
    fbAsyncInit?: () => void;
}

declare const FB: {
    init: (params: { xfbml: boolean; version: string }) => void;
};
