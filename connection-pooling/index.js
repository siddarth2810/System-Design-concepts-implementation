const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "mysecretpassword",
  port: 5432,
  max: 3,
  min: 1,
});

async function handleRequest(requestNumber) {
  let client;
  const startTime = new Date(); // Log the start time of the request
  console.log(`[${startTime.toISOString()}] Request ${requestNumber} started.`);

  try {
    client = await pool.connect();
    const connectionTime = new Date(); // Log when the connection is acquired
    console.log(
      `[${connectionTime.toISOString()}] Request ${requestNumber} acquired connection.`,
    );

    const res = await client.query("SELECT 'Hello, world!' as greeting;");
    console.log(
      `[${new Date().toISOString()}] Request ${requestNumber} response: ${
        res.rows[0].greeting
      }`,
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Request ${requestNumber} error:`,
      error,
    );
  } finally {
    if (client) {
      client.release(); // Release the client back to the pool
      console.log(
        `[${new Date().toISOString()}] Request ${requestNumber} released connection.`,
      );
    }
  }
}

async function main() {
  try {
    const requests = [
      handleRequest(1),
      handleRequest(2),
      handleRequest(3),
      handleRequest(4),
      handleRequest(5),
    ];
    await Promise.all(requests);
  } catch (error) {
    console.error(`error:`, error);
  } finally {
    await pool.end();
    console.log(`Pool has been closed.`);
  }
}

main();
