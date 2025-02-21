// server.js
const express = require("express");
const { Pool } = require("pg");
const fs = require("fs/promises");
const path = require("path");

const app = express();
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "items",
  password: "lol",
  port: 5432,
});

/*
 const { LocalStorage } = require("node-localstorage");

// Initialize local storage (persists to ./scratch directory)
const localStorage = new LocalStorage('./scratch');

 // Local storage cache with TTL
const cache = {
  ttl: 30000, // 30 seconds
  get(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    if (Date.now() > item.expires) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  },
  set(key, value) {
    const item = {
      value,
      expires: Date.now() + this.ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  },
  del(key) {
    localStorage.removeItem(key);
  },
};
 */

//  initialize the database
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        price DECIMAL(10,2),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

const diskCache = {
  cacheDir: path.join(__dirname, "cache"),
  ttl: 30000,

  async init() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log("Cache directory created at:", this.cacheDir);
    } catch (error) {
      console.error("Error creating cache dir:", error);
    }
  },

  getCacheFilePath(key) {
    return path.join(this.cacheDir, `${key}.json`);
  },

  async get(key) {
    try {
      const filePath = this.getCacheFilePath(key);
      const data = await fs.readFile(filePath, "utf8");
      const item = JSON.parse(data);
      if (Date.now() > item.expires) {
        await this.del(key);
        return null;
      }
      return item.value;
    } catch (error) {
      console.log("Cache miss:", error.message);
      return null;
    }
  },

  async set(key, value) {
    try {
      const filePath = this.getCacheFilePath(key);
      const cacheEntry = {
        value,
        expires: Date.now() + this.ttl,
      };
      await fs.writeFile(filePath, JSON.stringify(cacheEntry, null, 2));
      console.log(`Cache written for key ${key}`);
    } catch (error) {
      console.error(`Error writing cache for key ${key}:`, error);
    }
  },

  async del(key) {
    try {
      const filePath = this.getCacheFilePath(key);
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error(`Error deleting cache file for key ${key}:`, error);
      }
    }
  },
};

async function getDataFromDB(id) {
  const { rows } = await pool.query("SELECT * FROM items WHERE id=$1", [id]);
  return rows[0];
}

// Initialize both cache and database
async function initialize() {
  await diskCache.init();
  await initDB();
}

initialize();

// GET route
app.get("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cachedItem = await diskCache.get(id);

    if (cachedItem) {
      console.log("Cache hit");
      return res.json(cachedItem);
    }

    console.log("Cache miss");
    const item = await getDataFromDB(id);

    if (!item) {
      return res.status(404).send("Item not found");
    }

    await diskCache.set(id, item);
    res.json(item);
  } catch (error) {
    console.error("Error in GET /items/:id:", error);
    res.status(500).send("Internal Server Error");
  }
});

// POST route to add items
app.post("/items", async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const query = `
      INSERT INTO items (name, price, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [name, price, description]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error in POST /items:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
