const express = require("express");
const cors = require("cors");
const { initDb } = require("./db");
const ordersRouter = require("./routes/orders");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "node-orders-service" });
});

app.use("/orders", ordersRouter);

const PORT = process.env.PORT || 3000;

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Orders service (Node + MySQL) listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start Orders service:", err);
  process.exit(1);
});
