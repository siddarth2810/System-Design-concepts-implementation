const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "items",
  password: "lol",
  port: 5432,
});

//in memory cache structure
const cache = {
  data: {},
  ttl: 30000,
  get(key) {
    const item = this.data[key];
    if (!item) return null;

    if (Date.now() > item.expires) {
      delete this.data[key];
      return null;
    }

    return item.value;
  },
  set(key, value) {
    this.data[key] = {
      value,
      expires: Date.now() + this.ttl,
    };
  },
  del(key) {
    delete this.data[key];
  },
};

async function getDataFromDB(id) {
  const { rows } = await pool.query("SELECT * FROM items WHERE id= $1", [id]);
  return rows[0];
}

app.get("/items/:id", async (req, res) => {
  const { id } = req.params;
  const cachedItem = cache.get(id);
  if (cachedItem) {
    console.log("cache hit");
    return res.json(cachedItem);
  }
  console.log("cache miss");
  const item = await getDataFromDB(id);
  if (!item) {
    return res.status(404).send("item not found");
  }

  //update cache
  cache.set(id, item);
  res.json(item);
});

// Create item endpoint with cache update
app.post("/items", async (req, res) => {
  const { name, description } = req.body;
  const { rows } = await pool.query(
    "INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *",
    [name, description],
  );

  const newItem = rows[0];
  // Add new item to cache
  cache.set(newItem.id, newItem);
  res.status(201).json(newItem);
});

// Update item endpoint with cache invalidation
app.put("/items/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const { rows } = await pool.query(
    "UPDATE items SET name = $1, description = $2 WHERE id = $3 RETURNING *",
    [name, description, id],
  );

  if (rows.length === 0) {
    return res.status(404).send("Item not found");
  }

  const updatedItem = rows[0];
  // Update cache with new data
  cache.set(id, updatedItem);
  res.json(updatedItem);
});

// Delete item endpoint with cache invalidation
app.delete("/items/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM items WHERE id = $1", [id]);

  // Remove from cache
  cache.del(id);
  res.status(204).send();
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
