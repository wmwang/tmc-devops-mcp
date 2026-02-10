// Copyright (c) TMC Ltd.
// Licensed under the MIT License.

import "dotenv/config";
import express from "express";
import cors from "cors";
import { chatRouter, mcpClient } from "./routes/chat.js";
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
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        mcpConnected: mcpClient.isConnected(),
    });
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
    const server = app.listen(PORT, () => {
        logger.info(`TMC DevOps API Server running on http://localhost:${PORT}`);
    });

    // Graceful shutdown: 關閉 MCP Client 子進程
    const shutdown = async (signal: string) => {
        logger.info(`Received ${signal}, shutting down...`);
        await mcpClient.disconnect();
        server.close(() => {
            logger.info("API Server closed");
            process.exit(0);
        });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}

// Auto-start when run directly
startApiServer();

export { app };
