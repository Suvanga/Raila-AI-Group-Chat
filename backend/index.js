import express from "express";
import dotenv from "dotenv";
// import { connectOpenAI } from "./services/openai.js";
console.log("Starting server setup...");
const app = express();
dotenv.config();

// connectDB();
// connectOpenAI();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


as
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {

    console.log(`Server is running on port ${PORT}`);

});