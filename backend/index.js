import express from "express";
import dotenv from "dotenv";
import usersRouter from "./routes/users.js";
import { pingDB } from './database/db.js';


// import { connectOpenAI } from "./services/openai.js";
console.log("Starting server setup...");
const app = express();
dotenv.config();

// connectDB();
// connectOpenAI();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 4001;
app.get('/health', async (_req, res) => {
  try { res.json({ ok: await pingDB() }); }
  catch (e) { res.status(500).json({ ok:false, error:e.message }); }
});

app.use("/api/users", usersRouter);

app.listen(PORT, () => {

    console.log(`Server is running on port ${PORT}`);

});

