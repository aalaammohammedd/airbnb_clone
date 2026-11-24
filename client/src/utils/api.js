const configuredApiUrl = import.meta.env.VITE_API_URL || "/api";

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, "");

export const apiUrl = (path) =>
  `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
