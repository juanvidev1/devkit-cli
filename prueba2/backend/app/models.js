// models.js - definición de modelo de items para cada base de datos
const { DB_TYPE } = require("./db");

let ItemModel = null;

if (DB_TYPE === "mongo") {
  const mongoose = require("mongoose");
  const itemSchema = new mongoose.Schema({
    name: String,
    description: String,
  });
  ItemModel = mongoose.model("Item", itemSchema);
}

module.exports = { ItemModel };
