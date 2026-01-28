import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import bookRoutes from "./routes/bookRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import issueBookRoutes from "./routes/issueBookRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({ origin: "*", methods: ["GET","POST","PUT","DELETE","OPTIONS"], allowedHeaders: ["Content-Type","Authorization"] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/books", bookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/issued", issueBookRoutes);

// Serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve frontend
const frontendPath = path.resolve(__dirname, "../../frontend");
app.use(express.static(frontendPath));
app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(frontendPath, "index.html")));

// default API
app.get("/api", (req, res) => res.send("Library Management API is running!"));

// handle non-existing API routes
app.use("/api/*", (req, res) => res.status(404).json({ message: "API route not found" }));

export default app;
