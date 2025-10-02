// db.js - inicialización dinámica según tipo de base de datos
require("dotenv").config();
const DB_TYPE = process.env.DB_TYPE || "sqlite";

let db = null;
let orm = null;

if (DB_TYPE === "sqlite") {
  const sqlite3 = require("sqlite3").verbose();
  const { open } = require("sqlite");
  orm = async () =>
    open({
      filename: process.env.SQLITE_FILE || "./data.db",
      driver: sqlite3.Database,
    });
} else if (DB_TYPE === "mysql") {
  const mysql = require("mysql2/promise");
  orm = async () =>
    mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || "user",
      password: process.env.MYSQL_PASSWORD || "password",
      database: process.env.MYSQL_DATABASE || "mydb",
    });
} else if (DB_TYPE === "postgres") {
  const { Client } = require("pg");
  orm = async () =>
    new Client({
      host: process.env.PG_HOST || "localhost",
      port: process.env.PG_PORT || 5432,
      user: process.env.PG_USER || "user",
      password: process.env.PG_PASSWORD || "password",
      database: process.env.PG_DATABASE || "mydb",
    });
} else if (DB_TYPE === "mongo") {
  const mongoose = require("mongoose");
  orm = async () => {
    const uri =
      process.env.MONGO_URI || `mongodb://user:password@localhost:27017/mydb`;
    await mongoose.connect(uri);
    return mongoose;
  };
}

module.exports = { orm, DB_TYPE };
