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
        const tag = isRequired ? "必填" : "選填";
        let desc = prop.description || "";
        // 截短過長的描述
        if (desc.length > 80) desc = desc.substring(0, 77) + "...";
        let typeStr = prop.type || "any";
        if (prop.enum) {
            typeStr = prop.enum.slice(0, 5).join("|");
            if (prop.enum.length > 5) typeStr += "|...";
        }
        params.push(`    ${name} (${typeStr}, ${tag}): ${desc}`);
    }

    return params.join("\n");
}

/**
 * 將工具按前綴分類，並產生包含參數資訊的工具列表
 */
function categorizeTools(tools: ToolInfo[]): string {
    // 依前綴分組
    const categories: Record<string, ToolInfo[]> = {};
    for (const tool of tools) {
        const prefix = tool.name.split("_")[0];
        if (!categories[prefix]) {
            categories[prefix] = [];
        }
        categories[prefix].push(tool);
    }

    // 類別中文名稱映射
    const categoryNames: Record<string, string> = {
        core: "🏢 組織與專案",
        repo: "📁 儲存庫與 Pull Request",
        wit: "📋 工作項目 (Work Items)",
        pipelines: "🔧 Pipeline 與建置",
        work: "📅 迭代與容量",
        search: "🔍 搜尋",
        wiki: "📖 Wiki",
        testplan: "🧪 測試計畫",
        advsec: "🔒 進階安全性",
    };

    const sections: string[] = [];
    for (const [prefix, categoryTools] of Object.entries(categories)) {
        const categoryName = categoryNames[prefix] || `📌 ${prefix}`;
        const toolLines = categoryTools
            .map((t) => {
                const params = formatParams(t.inputSchema);
                return `- **${t.name}**: ${t.description}\n  參數:\n${params}`;
            })
            .join("\n\n");
        sections.push(`### ${categoryName}\n\n${toolLines}`);
    }

    return sections.join("\n\n");
}

export function getSystemPrompt(tools: ToolInfo[]): string {
    const defaultProject = process.env.DEFAULT_PROJECT || "";

    const toolList = categorizeTools(tools);

    const defaultProjectSection = defaultProject
        ? `
## 預設專案
使用者已設定預設專案為 **${defaultProject}**。
- 當工具需要 project 參數且使用者沒有指定時，自動使用 "${defaultProject}"
- 使用者明確指定其他專案時，使用使用者指定的專案
`
        : "";

    return `你是 TMC DevOps AI 助手，專門協助使用者與 Azure DevOps 互動。
${defaultProjectSection}
## 回應格式規則（非常重要）

你必須嚴格遵守以下格式。每一次回應只能使用以下兩種格式之一：

### 格式一：呼叫工具
Thought: （你的推理過程）
Action: （工具名稱，必須是下方列出的其中一個）
Action Input: {"param1": "value1", "param2": "value2"}

### 格式二：最終回答
Final Answer: （你的最終回答）

**重要提醒：**
- 每次回應只做一件事：呼叫一個工具或給出最終答案
- Action Input 必須是嚴格有效的 JSON 格式
- 當需要執行多個步驟（例如更新多個工作項目），請逐一執行，每次只呼叫一個工具
- 收到 Observation 後，繼續下一步或給出 Final Answer
- 如果有批量操作工具（如 wit_update_work_items_batch），優先使用它來一次完成多個操作

## 可用工具

${toolList}

## 注意事項
1. 使用繁體中文回答使用者
2. 如果工具回傳錯誤，嘗試解釋或使用其他方法
3. 對於列表類的結果，整理成易讀的格式
4. 優先使用批量操作工具（如 wit_update_work_items_batch）來提高效率
${defaultProject ? `5. 當需要專案名稱但使用者沒有指定時，使用預設專案 "${defaultProject}"` : ""}
`;
}
