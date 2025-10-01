import { Router } from "express";
import { pool } from "../database/db.js";
const r = Router();

r.post("/", async (req, res, next) => {
  try {
    const { username, inviteCode } = req.body;
    if (!username) return res.status(400).json({ error: "username required" });

    const { rows } = await pool.query(
      `insert into users (username, invite_code)
       values ($1,$2) returning *`,
      [username, inviteCode ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === "23505") {
      // unique violation
      return res.status(409).json({ error: "username already taken" });
    }
    next(e);
  }
});

// list recent users
r.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `select * from users order by created_at desc limit 50`
    );
  res.json(rows);
  } catch (e) { next(e); }
});

export default r;
