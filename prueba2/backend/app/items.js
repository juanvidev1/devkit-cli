const express = require("express");
const router = express.Router();
const { orm, DB_TYPE } = require("./db");
const { ItemModel } = require("./models");

// CRUD multi-bd
// GET /items
router.get("/", async (req, res) => {
  try {
    if (DB_TYPE === "mongo") {
      const items = await ItemModel.find();
      return res.json(items);
    }
    const db = await orm();
    if (DB_TYPE === "sqlite") {
      await db.run(
        "CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT)"
      );
      const rows = await db.all("SELECT * FROM items");
      return res.json(rows);
    } else if (DB_TYPE === "mysql") {
      await db.execute(
        "CREATE TABLE IF NOT EXISTS items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), description TEXT)"
      );
      const [rows] = await db.execute("SELECT * FROM items");
      return res.json(rows);
    } else if (DB_TYPE === "postgres") {
      await db.connect();
      await db.query(
        "CREATE TABLE IF NOT EXISTS items (id SERIAL PRIMARY KEY, name VARCHAR(255), description TEXT)"
      );
      const { rows } = await db.query("SELECT * FROM items");
      await db.end();
      return res.json(rows);
    } else {
      // memoria
      if (!global.items) global.items = [];
      return res.json(global.items);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /items
router.post("/", async (req, res) => {
  const { name, description } = req.body;
  try {
    if (DB_TYPE === "mongo") {
      const item = await ItemModel.create({ name, description });
      return res.status(201).json(item);
    }
    const db = await orm();
    if (DB_TYPE === "sqlite") {
      const result = await db.run(
        "INSERT INTO items (name, description) VALUES (?, ?)",
        [name, description]
      );
      const item = { id: result.lastID, name, description };
      return res.status(201).json(item);
    } else if (DB_TYPE === "mysql") {
      const [result] = await db.execute(
        "INSERT INTO items (name, description) VALUES (?, ?)",
        [name, description]
      );
      const item = { id: result.insertId, name, description };
      return res.status(201).json(item);
    } else if (DB_TYPE === "postgres") {
      await db.connect();
      const result = await db.query(
        "INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *",
        [name, description]
      );
      await db.end();
      return res.status(201).json(result.rows[0]);
    } else {
      if (!global.items) global.items = [];
      const id = global.items.length
        ? global.items[global.items.length - 1].id + 1
        : 1;
      const item = { id, name, description };
      global.items.push(item);
      return res.status(201).json(item);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /items/:id
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const { name, description } = req.body;
  try {
    if (DB_TYPE === "mongo") {
      const item = await ItemModel.findByIdAndUpdate(
        id,
        { name, description },
        { new: true }
      );
      if (!item) return res.status(404).json({ error: "Item no encontrado" });
      return res.json(item);
    }
    const db = await orm();
    if (DB_TYPE === "sqlite") {
      const result = await db.run(
        "UPDATE items SET name = ?, description = ? WHERE id = ?",
        [name, description, id]
      );
      if (result.changes === 0)
        return res.status(404).json({ error: "Item no encontrado" });
      return res.json({ id: Number(id), name, description });
    } else if (DB_TYPE === "mysql") {
      const [result] = await db.execute(
        "UPDATE items SET name = ?, description = ? WHERE id = ?",
        [name, description, id]
      );
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Item no encontrado" });
      return res.json({ id: Number(id), name, description });
    } else if (DB_TYPE === "postgres") {
      await db.connect();
      const result = await db.query(
        "UPDATE items SET name = $1, description = $2 WHERE id = $3 RETURNING *",
        [name, description, id]
      );
      await db.end();
      if (result.rowCount === 0)
        return res.status(404).json({ error: "Item no encontrado" });
      return res.json(result.rows[0]);
    } else {
      if (!global.items) global.items = [];
      const item = global.items.find((i) => i.id == id);
      if (!item) return res.status(404).json({ error: "Item no encontrado" });
      item.name = name;
      item.description = description;
      return res.json(item);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /items/:id
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    if (DB_TYPE === "mongo") {
      const result = await ItemModel.findByIdAndDelete(id);
      if (!result) return res.status(404).json({ error: "Item no encontrado" });
      return res.status(204).end();
    }
    const db = await orm();
    if (DB_TYPE === "sqlite") {
      const result = await db.run("DELETE FROM items WHERE id = ?", [id]);
      if (result.changes === 0)
        return res.status(404).json({ error: "Item no encontrado" });
      return res.status(204).end();
    } else if (DB_TYPE === "mysql") {
      const [result] = await db.execute("DELETE FROM items WHERE id = ?", [id]);
      if (result.affectedRows === 0)
        return res.status(404).json({ error: "Item no encontrado" });
      return res.status(204).end();
    } else if (DB_TYPE === "postgres") {
      await db.connect();
      const result = await db.query("DELETE FROM items WHERE id = $1", [id]);
      await db.end();
      if (result.rowCount === 0)
        return res.status(404).json({ error: "Item no encontrado" });
      return res.status(204).end();
    } else {
      if (!global.items) global.items = [];
      const idx = global.items.findIndex((i) => i.id == id);
      if (idx === -1)
        return res.status(404).json({ error: "Item no encontrado" });
      global.items.splice(idx, 1);
      return res.status(204).end();
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
