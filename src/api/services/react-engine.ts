// Copyright (c) TMC Ltd.
// Licensed under the MIT License.

import OpenAI from "openai";
import { MCPClient } from "./mcp-client.js";
import { getSystemPrompt } from "../prompts/system-prompt.js";
import { parseAction, ActionResult } from "./action-parser.js";
import { logger } from "../../logger.js";

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface StreamChunk {
    type: "thought" | "action" | "observation" | "answer" | "error";
    content: string;
}

export class ReActEngine {
    private openai: OpenAI;
    private mcpClient: MCPClient;
    private maxIterations: number = 10;
    private initialized: boolean = false;

    constructor(mcpClient: MCPClient) {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || "",
            baseURL: process.env.OPENAI_BASE_URL,
        });
        this.mcpClient = mcpClient;
    }

    /**
     * 確保 MCP Client 已連線
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.initialized) {
            if (!this.mcpClient.isConnected()) {
                await this.mcpClient.connect();
            }
            this.initialized = true;
        }
    }

    async process(
        userMessage: string,
        conversationHistory: ChatMessage[],
        onChunk: (chunk: StreamChunk) => void
    ): Promise<void> {
        await this.ensureInitialized();

        const tools = this.mcpClient.getToolInfos();
        const messages: ChatMessage[] = [
            { role: "system", content: getSystemPrompt(tools) },
            ...conversationHistory,
            { role: "user", content: userMessage },
        ];

        let iteration = 0;

        while (iteration < this.maxIterations) {
            iteration++;
            logger.info(`ReAct iteration ${iteration}`);

            // Get LLM response
            const response = await this.callLLM(messages);
            logger.debug(`LLM response: ${response}`);

            // Parse the response
            const parsed = parseAction(response);

            if (parsed.thought) {
                onChunk({ type: "thought", content: parsed.thought });
            }

            if (parsed.finalAnswer) {
                onChunk({ type: "answer", content: parsed.finalAnswer });
                break;
            }

            if (parsed.action && parsed.actionInput) {
                onChunk({
                    type: "action",
                    content: `執行工具: ${parsed.action}`,
                });

                // Execute the action via MCP Client
                try {
                    const result = await this.mcpClient.callTool(
                        parsed.action,
                        parsed.actionInput
                    );

                    // MCP Client 的 callTool 已經回傳文字
                    const observation = result;
                    onChunk({ type: "observation", content: observation });

                    // Add to conversation for next iteration
                    messages.push({ role: "assistant", content: response });
                    messages.push({
                        role: "user",
                        content: `Observation: ${observation}`,
                    });
                } catch (error) {
                    const errorMsg =
                        error instanceof Error ? error.message : "Unknown error";
                    onChunk({ type: "error", content: errorMsg });
                    messages.push({ role: "assistant", content: response });
                    messages.push({
                        role: "user",
                        content: `Observation: Error - ${errorMsg}`,
                    });
                }
            } else {
                // No action found, treat as final answer
                onChunk({ type: "answer", content: response });
                break;
            }
        }

        if (iteration >= this.maxIterations) {
            onChunk({
                type: "error",
                content: "達到最大迭代次數，請嘗試更簡單的問題。",
            });
        }
    }

    async processSimple(
        userMessage: string,
        conversationHistory: ChatMessage[]
    ): Promise<{ answer: string; steps: StreamChunk[] }> {
        const steps: StreamChunk[] = [];

        await this.process(userMessage, conversationHistory, (chunk) => {
            steps.push(chunk);
        });

        const answerChunk = steps.find((s) => s.type === "answer");
        return {
            answer: answerChunk?.content || "無法取得答案",
            steps,
        };
    }

    private async callLLM(messages: ChatMessage[]): Promise<string> {
        const response = await this.openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o",
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
            temperature: 0.2,
            max_tokens: 2000,
        });

        return response.choices[0]?.message?.content || "";
    }
}
