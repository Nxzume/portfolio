const apiUrl = import.meta.env.VITE_CMS_API_URL ?? "http://localhost:8787";
const apiKey = import.meta.env.VITE_CMS_PUBLIC_KEY ?? "dev-public-key";
const adminUrl = import.meta.env.VITE_ADMIN_URL ?? "http://localhost:5173/admin";

export { apiUrl, apiKey, adminUrl };
