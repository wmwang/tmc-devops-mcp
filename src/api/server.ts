// Copyright (c) TMC Ltd.
// Licensed under the MIT License.

import "dotenv/config";
import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat.js";
import { logger } from "../logger.js";

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/chat", chatRouter);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling
app.use(
    (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        logger.error("API Error:", err);
        res.status(500).json({ error: err.message });
    }
);

export function startApiServer() {
    app.listen(PORT, () => {
        logger.info(`TMC DevOps API Server running on http://localhost:${PORT}`);
    });
}

// Auto-start when run directly
startApiServer();

export { app };
