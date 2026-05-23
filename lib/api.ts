import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
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
