// Copyright (c) TMC Ltd.
// Licensed under the MIT License.

import type { ToolInfo } from "../services/mcp-client.js";

interface SchemaProperty {
    type?: string;
    description?: string;
    enum?: string[];
    items?: { type?: string; properties?: Record<string, SchemaProperty> };
    default?: unknown;
}

/**
 * 從 JSON Schema 中提取簡潔的參數描述
 */
function formatParams(schema?: Record<string, unknown>): string {
    if (!schema || !schema.properties) return "（無需參數）";

    const props = schema.properties as Record<string, SchemaProperty>;
    const required = (schema.required as string[]) || [];

    const params: string[] = [];
    for (const [name, prop] of Object.entries(props)) {
        const isRequired = required.includes(name);
        // 移除括號內的標記，使格式更乾淨
        const tag = isRequired ? "必填" : "選填";
        let desc = prop.description || "";
        if (desc.length > 80) desc = desc.substring(0, 77) + "...";
        let typeStr = prop.type || "any";
        if (prop.enum) {
            typeStr = prop.enum.slice(0, 5).join("|");
            if (prop.enum.length > 5) typeStr += "|...";
        }
        params.push(`${name} (${typeStr}, ${tag}): ${desc}`);
    }

    return params.join("\n");
}

/**
 * 將工具按前綴分類，並產生極簡的工具列表
 */
function categorizeTools(tools: ToolInfo[]): string {
    const categories: Record<string, ToolInfo[]> = {};
    for (const tool of tools) {
        const prefix = tool.name.split("_")[0];
        if (!categories[prefix]) {
            categories[prefix] = [];
        }
        categories[prefix].push(tool);
    }

    const sections: string[] = [];
    for (const [prefix, categoryTools] of Object.entries(categories)) {
        // 直接列出工具，不需要分類標題
        const toolLines = categoryTools
            .map((t) => {
                const params = formatParams(t.inputSchema);
                // 使用縮排來表示層級結構，但保持純文字風格
                return `Tool: ${t.name}\nDescription: ${t.description}\nParams:\n${params}`;
            })
            .join("\n\n");
        sections.push(toolLines);
    }

    return sections.join("\n\n");
}

export function getSystemPrompt(tools: ToolInfo[]): string {
    const defaultProject = process.env.DEFAULT_PROJECT || "";

    const toolList = categorizeTools(tools);

    // 移除所有 Markdown 標題，使用 [Section] 風格
    return `[System]
你是 TMC DevOps AI 助手。
你必須嚴格遵守以下格式回答。

[Format]
1. 呼叫工具:
Thought: 思考
Action: 工具名稱
Action Input: JSON參數

2. 最終回答:
Final Answer: 回答內容

[Tools]
${toolList}

[Rules]
1. 一次只呼叫一個工具。
2. Action Input 必須是嚴格有效的 JSON。
3. 優先使用批量操作工具（如 wit_update_work_items_batch）。
${defaultProject ? `4. 預設專案: "${defaultProject}"` : ""}
5. 如果工具回傳錯誤，嘗試解釋或使用其他方法。
`;
}
