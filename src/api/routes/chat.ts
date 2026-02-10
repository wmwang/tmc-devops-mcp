// Copyright (c) TMC Ltd.
// Licensed under the MIT License.

import { Router, Request, Response } from "express";
import { ReActEngine } from "../services/react-engine.js";
import { MCPClient } from "../services/mcp-client.js";
import { logger } from "../../logger.js";
import type { ChatMessage, StreamChunk } from "../services/react-engine.js";

export const chatRouter = Router();

// 建立共享的 MCP Client 和 ReAct Engine
const mcpClient = new MCPClient();
const reactEngine = new ReActEngine(mcpClient);

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

// 取得 MCP 工具清單（分類後）
chatRouter.get("/tools", async (_req: Request, res: Response) => {
    try {
        // 確保 MCP Client 已連線
        if (!mcpClient.isConnected()) {
            await mcpClient.connect();
        }

        const tools = mcpClient.getToolInfos();

        // 將工具按前綴分類
        const categories: Record<string, { name: string; tools: Array<{ name: string; description: string }> }> = {};
        const categoryMeta: Record<string, { label: string; icon: string }> = {
            core: { label: "組織與專案", icon: "🏢" },
            repo: { label: "儲存庫與 PR", icon: "📁" },
            wit: { label: "工作項目", icon: "📋" },
            pipelines: { label: "Pipeline", icon: "🔧" },
            work: { label: "迭代與容量", icon: "📅" },
            search: { label: "搜尋", icon: "🔍" },
            wiki: { label: "Wiki", icon: "📖" },
            testplan: { label: "測試計畫", icon: "🧪" },
            advsec: { label: "進階安全性", icon: "🔒" },
        };

        for (const tool of tools) {
            const prefix = tool.name.split("_")[0];
            if (!categories[prefix]) {
                const meta = categoryMeta[prefix] || { label: prefix, icon: "📌" };
                categories[prefix] = {
                    name: `${meta.icon} ${meta.label}`,
                    tools: [],
                };
            }
            categories[prefix].tools.push({
                name: tool.name,
                description: tool.description,
            });
        }

        res.json({
            connected: true,
            totalTools: tools.length,
            categories: Object.values(categories),
        });
    } catch (error) {
        logger.error("Tools list error:", error);
        res.json({
            connected: false,
            totalTools: 0,
            categories: [],
        });
    }
});

// 取得 MCP 連線狀態
chatRouter.get("/status", (_req: Request, res: Response) => {
    res.json({
        connected: mcpClient.isConnected(),
        totalTools: mcpClient.isConnected() ? mcpClient.getToolInfos().length : 0,
    });
});

// 匯出 mcpClient 讓 server.ts 可以管理它的生命週期
export { mcpClient };
