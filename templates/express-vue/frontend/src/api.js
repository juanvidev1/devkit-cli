// API helpers para consumir el backend Express
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function login(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

export async function getItems(token) {
  const res = await fetch(`${API_URL}/items`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Error al obtener items");
  return res.json();
}

export async function createItem(item, token) {
  const res = await fetch(`${API_URL}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Error al crear item");
  return res.json();
}

export async function getMe(token) {
  const res = await fetch(`${API_URL}/protected/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("No autorizado");
  return res.json();
}
