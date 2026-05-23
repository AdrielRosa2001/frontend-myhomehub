import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("dmapla_token");
    if (token) {
      // FORMA CORRETA para versões recentes do Axios:
      config.headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return config;
});
