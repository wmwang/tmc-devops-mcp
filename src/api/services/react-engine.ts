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
    private maxIterations: number = 15;
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
        let consecutiveNoAction = 0;

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
                consecutiveNoAction = 0;

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
            } else if (parsed.action && !parsed.actionInput) {
                // LLM 輸出了 Action 但沒有 Action Input，提示它補全
                consecutiveNoAction++;
                logger.warn(`Iteration ${iteration}: Action found but no Action Input, prompting LLM to complete`);
                messages.push({ role: "assistant", content: response });
                messages.push({
                    role: "user",
                    content: `你只輸出了 Action: ${parsed.action}，但缺少 Action Input。請重新輸出完整的格式，包含 Action Input（JSON 格式的參數）。`,
                });
            } else {
                // 沒有 Action 也沒有 Final Answer
                consecutiveNoAction++;

                if (consecutiveNoAction >= 2) {
                    // 連續兩次都沒有正確格式，直接把回應當最終答案
                    logger.warn(`Iteration ${iteration}: ${consecutiveNoAction} consecutive responses without action, treating as final answer`);
                    onChunk({ type: "answer", content: response });
                    break;
                }

                // 第一次沒有正確格式，提示 LLM 遵循格式
                logger.warn(`Iteration ${iteration}: No action or final answer found, prompting LLM to follow format`);
                messages.push({ role: "assistant", content: response });
                messages.push({
                    role: "user",
                    content: `請使用正確的格式回應。如果你需要呼叫工具，請使用：
Thought: （你的推理）
Action: （工具名稱）
Action Input: （JSON 參數）

如果你已經有足夠資訊回答，請使用：
Final Answer: （你的回答）`,
                });
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
            temperature: 0.1,
            max_tokens: 4000,
        });

        return response.choices[0]?.message?.content || "";
    }
}
