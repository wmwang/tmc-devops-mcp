// Copyright (c) TMC Ltd.
// Licensed under the MIT License.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { logger } from "../../logger.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ToolInfo {
    name: string;
    description: string;
    inputSchema?: Record<string, unknown>;
}

export class MCPClient {
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;
    private cachedTools: ToolInfo[] = [];
    private connected: boolean = false;

    /**
     * 啟動 MCP Server 子進程並建立連線
     */
    async connect(): Promise<void> {
        if (this.connected) {
            logger.info("MCPClient already connected");
            return;
        }

        const org = process.env.ADO_ORG;
        if (!org) {
            throw new Error("ADO_ORG environment variable is required for MCP Client");
        }

        // MCP Server 的入口在 dist/index.js
        // 相對於此檔案 (dist/api/services/mcp-client.js) 往上三層到 dist/index.js
        const serverPath = path.resolve(__dirname, "..", "..", "index.js");

        logger.info(`Starting MCP Server subprocess: node ${serverPath} ${org} --authentication envvar`);

        // 建構環境變數，確保子進程可以讀到所有必要的 env
        const env: Record<string, string> = {};
        for (const [key, value] of Object.entries(process.env)) {
            if (value !== undefined) {
                env[key] = value;
            }
        }

        this.transport = new StdioClientTransport({
            command: "node",
            args: [serverPath, org, "--authentication", "envvar"],
            env,
            stderr: "pipe",
        });

        // 監聽 stderr 以便除錯
        const stderrStream = this.transport.stderr;
        if (stderrStream) {
            stderrStream.on("data", (data: Buffer) => {
                const msg = data.toString().trim();
                if (msg) {
                    logger.debug(`[MCP Server stderr] ${msg}`);
                }
            });
        }

        this.client = new Client(
            {
                name: "tmc-devops-chatbot",
                version: "1.0.0",
            },
            {
                capabilities: {},
            }
        );

        try {
            await this.client.connect(this.transport);
            this.connected = true;
            logger.info("MCPClient connected to MCP Server successfully");

            // 連線後立即快取所有可用工具
            await this.refreshTools();
        } catch (error) {
            this.connected = false;
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error(`MCPClient failed to connect: ${errorMsg}`);
            throw new Error(`Failed to connect to MCP Server: ${errorMsg}`);
        }
    }

    /**
     * 從 MCP Server 重新取得所有可用工具列表
     */
    async refreshTools(): Promise<void> {
        if (!this.client) {
            throw new Error("MCPClient is not connected");
        }

        try {
            const result = await this.client.listTools();
            this.cachedTools = result.tools.map((t) => ({
                name: t.name,
                description: t.description || "",
                inputSchema: t.inputSchema as Record<string, unknown>,
            }));
            logger.info(`MCPClient loaded ${this.cachedTools.length} tools from MCP Server`);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to list tools: ${errorMsg}`);
            throw error;
        }
    }

    /**
     * 透過 MCP 協議呼叫工具
     */
    async callTool(
        name: string,
        args: Record<string, unknown>
    ): Promise<string> {
        if (!this.client) {
            throw new Error("MCPClient is not connected");
        }

        logger.info(`Calling MCP tool: ${name}`, args);

        try {
            const result = await this.client.callTool({ name, arguments: args });

            // MCP callTool 回傳 { content: [{ type: "text", text: "..." }] }
            if (result && "content" in result && Array.isArray(result.content)) {
                const textContent = result.content
                    .filter((c: { type: string }) => c.type === "text")
                    .map((c: { text: string }) => c.text)
                    .join("\n");
                return textContent;
            }

            return JSON.stringify(result);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error(`Tool call failed: ${name} - ${errorMsg}`);
            throw new Error(`Tool '${name}' execution failed: ${errorMsg}`);
        }
    }

    /**
     * 取得快取的可用工具名稱列表
     */
    getAvailableTools(): string[] {
        return this.cachedTools.map((t) => t.name);
    }

    /**
     * 取得快取的工具資訊（含描述）
     */
    getToolInfos(): ToolInfo[] {
        return [...this.cachedTools];
    }

    /**
     * 取得工具名稱對描述的映射
     */
    getToolDescriptions(): Record<string, string> {
        const descriptions: Record<string, string> = {};
        for (const tool of this.cachedTools) {
            descriptions[tool.name] = tool.description;
        }
        return descriptions;
    }

    /**
     * 關閉連線和子進程
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            try {
                await this.client.close();
                logger.info("MCPClient disconnected");
            } catch (error) {
                logger.warn("Error during MCPClient disconnect:", error);
            }
            this.client = null;
            this.transport = null;
            this.connected = false;
        }
    }

    /**
     * 確認是否已連線
     */
    isConnected(): boolean {
        return this.connected;
    }
}
