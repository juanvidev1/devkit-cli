// Autenticación JWT demo
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Usuario demo
const user = {
  username: "demo",
  // hash de "password" generado con bcryptjs
  passwordHash:
    "$2a$10$wQwQwQwQwQwQwQwQwQwQwOQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQw",
};

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (username !== user.username) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ access_token: token, token_type: "bearer" });
});

// Middleware para proteger rutas
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }
  const token = auth.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

module.exports = { router, requireAuth };
