import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import bookRoutes from "./routes/bookRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import issueBookRoutes from "./routes/issueBookRoutes.js";

// Load env variables
dotenv.config();

// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/books", bookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/issued", issueBookRoutes);

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve frontend folder (adjusted path)
app.use(express.static(path.join(__dirname, "../../frontend")));

// SPA fallback for any non-API route
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/index.html"));
});

// Optional default API route
app.get("/api", (req, res) => {
  res.send("Library Management API is running!");
});

export default app;
