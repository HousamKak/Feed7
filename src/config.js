export const BASE = import.meta.env.BASE_URL;
export const STATIC_HOSTED = import.meta.env.VITE_STATIC_HOSTED === 'true';
export const assetUrl = path => `${BASE}${path.replace(/^\//, '')}`;
