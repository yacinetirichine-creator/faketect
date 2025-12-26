// Centralize API base URL selection for the web app.
// Vite replaces import.meta.env at build time.

const FALLBACK_API_URL = 'https://faketect-api.onrender.com';

function normalizeBaseUrl(url) {
  const trimmed = String(url || '').trim().replace(/\/+$/, '');
  // Accept both https://host and https://host/api (common misconfig)
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
}

export const API_BASE_URL = (() => {
  const raw = normalizeBaseUrl(import.meta.env.VITE_API_URL);
  if (!raw) return FALLBACK_API_URL;

  // If the custom domain isn't configured yet, fall back to Render.
  // (Prevents infinite loading due to DNS/SSL misconfiguration.)
  if (raw === 'https://api.faketect.com') return FALLBACK_API_URL;

  return raw;
})();
