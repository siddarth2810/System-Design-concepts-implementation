const express = require("express");
const redis = require("redis");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const redisClient = redis.createClient({
  socket: {
    host: "localhost",
    port: 6379,
  },
});

redisClient
  .connect()
  .then(() => {
    console.log("connected to redis");
  })
  .catch(console.error);

app.post("/heartbeat", async (req, res) => {
  const { userId } = req.body;

  try {
    await redisClient.set(`user:${userId}`, "online", {
      EX: 30,
      NX: false,
    });
    res.sendStatus(200);
  } catch (error) {
    console.error("error: ", error);
    res.sendStatus(500);
  }
});

app.get("/status", async (req, res) => {
  const userIds = req.query.userIds.split(",").map(Number);

  try {
    //create user:1, user:2
    const keys = userIds.map((id) => `user:${id}`);

    //mget returns null for expired keys
    const results = await redisClient.mGet(keys);

    const statusMap = {};

    // {1: true, 2:false...}
    userIds.forEach((id, index) => {
      statusMap[id] = results[index] !== null;
    });

    res.json(statusMap);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.listen(3000, () => {
  console.log("server is listening in port 3000");
});
