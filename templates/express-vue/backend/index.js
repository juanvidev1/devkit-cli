require("dotenv").config();
const express = require("express");
const cors = require("cors");
const itemsRouter = require("./items");
const { router: authRouter, requireAuth } = require("./auth");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello from Express backend!" });
});

// Rutas públicas
app.use("/auth", authRouter);
app.use("/items", itemsRouter);

// Ruta protegida de ejemplo
app.get("/protected/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.listen(PORT, () => {
  console.log(`Express backend listening on port ${PORT}`);
});
