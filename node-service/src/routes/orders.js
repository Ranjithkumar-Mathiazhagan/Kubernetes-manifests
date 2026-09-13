const express = require("express");
const axios = require("axios");
const { pool } = require("../db");

const router = express.Router();

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

// Create an order — first checks with the Python Users service that the user exists.
router.post("/", async (req, res) => {
  const { user_id, item, quantity } = req.body;

  if (!user_id || !item || !quantity) {
    return res.status(400).json({ error: "user_id, item, and quantity are required" });
  }

  try {
    // --- This call is the "link" between the two apps ---
    await axios.get(`${PYTHON_SERVICE_URL}/users/${user_id}`);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: `User ${user_id} does not exist in Users service` });
    }
    return res.status(502).json({ error: "Could not reach Users service", details: err.message });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO orders (user_id, item, quantity) VALUES (?, ?, ?)",
      [user_id, item, quantity]
    );
    res.status(201).json({ id: result.insertId, user_id, item, quantity });
  } catch (err) {
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

router.get("/", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM orders ORDER BY id DESC");
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: "Order not found" });
  res.json(rows[0]);
});

module.exports = router;
