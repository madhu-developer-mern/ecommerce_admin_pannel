const DEFAULT_BACKEND_ORIGIN = "http://localhost:5001";

function removeTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function normalizeBaseUrl() {
  const explicitBase = removeTrailingSlash(import.meta.env.VITE_API_BASE_URL);
  if (explicitBase) {
    return explicitBase;
  }

  const apiUrl = removeTrailingSlash(import.meta.env.VITE_API_URL);
  if (apiUrl.endsWith("/api")) {
    return apiUrl.slice(0, -4);
  }

  return apiUrl || DEFAULT_BACKEND_ORIGIN;
}

export const API_BASE_URL = normalizeBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;
