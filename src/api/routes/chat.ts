// Copyright (c) TMC Ltd.
// Licensed under the MIT License.

import { Router, Request, Response } from "express";
import { ReActEngine } from "../services/react-engine.js";
import { logger } from "../../logger.js";
import type { ChatMessage, StreamChunk } from "../services/react-engine.js";

export const chatRouter = Router();

const reactEngine = new ReActEngine();

interface ChatRequest {
    message: string;
    conversationHistory?: Array<{ role: string; content: string }>;
}

chatRouter.post("/", async (req: Request, res: Response) => {
    try {
        const { message, conversationHistory = [] } = req.body as ChatRequest;

        if (!message) {
            res.status(400).json({ error: "Message is required" });
            return;
        }

        logger.info(`Received chat message: ${message}`);

        // Set headers for Server-Sent Events (SSE)
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // Process with ReAct engine
        await reactEngine.process(message, conversationHistory as ChatMessage[], (chunk: StreamChunk) => {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        });

        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();
    } catch (error) {
        logger.error("Chat error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Simple non-streaming endpoint for testing
chatRouter.post("/simple", async (req: Request, res: Response) => {
    try {
        const { message, conversationHistory = [] } = req.body as ChatRequest;

        if (!message) {
            res.status(400).json({ error: "Message is required" });
            return;
        }

        const result = await reactEngine.processSimple(message, conversationHistory as ChatMessage[]);
        res.json(result);
    } catch (error) {
        logger.error("Chat error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
