const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

let userPresence = {
  userId: 1,
  isOnline: false,
};

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "users",
  password: "lol",
  port: 5432,
});

app.get("/api/presence", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching ", error);
  }
});

app.post("/api/presence", (req, res) => {});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
