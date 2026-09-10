import axios from "axios";

const productionApiUrl = "https://newsportalbackend.pythonanywhere.com/api";
const developmentApiUrl = "http://127.0.0.1:8000/api";
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

// The admin API is rooted at /api. Remove an accidental staff-app suffix
// from an old deployment variable so login never becomes /api/staff/admin/.
let baseURL = configuredApiUrl || (import.meta.env.DEV ? developmentApiUrl : productionApiUrl);
try {
  const configuredUrl = new URL(baseURL, window.location.origin);
  if (configuredUrl.pathname.replace(/\/$/, "").endsWith("/staff")) {
    configuredUrl.pathname = configuredUrl.pathname.replace(/\/staff\/?$/, "");
    baseURL = configuredUrl.toString().replace(/\/$/, "");
  }
} catch {
  baseURL = import.meta.env.DEV ? developmentApiUrl : productionApiUrl;
}

const api = axios.create({ baseURL, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("admin_refresh_token");
      window.location.reload();
    }
    return Promise.reject(error);
  },
);

export default api;
