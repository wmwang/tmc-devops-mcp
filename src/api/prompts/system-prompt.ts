// Copyright (c) TMC Ltd.
// Licensed under the MIT License.

import type { ToolInfo } from "../services/mcp-client.js";

export function getSystemPrompt(tools: ToolInfo[]): string {
    const defaultProject = process.env.DEFAULT_PROJECT || "";

    const toolList = tools
        .map((t) => `- ${t.name}: ${t.description || "Azure DevOps 工具"}`)
        .join("\n");

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
## 回應格式
請使用以下格式回答問題：

Thought: （你的推理過程，解釋你要做什麼）
Action: （要呼叫的工具名稱）
Action Input: （工具參數，JSON 格式）

當你收到 Observation 後，繼續推理直到有足夠資訊回答。

當你有足夠資訊可以回答使用者的問題時，使用：
Final Answer: （最終回答，使用繁體中文）

## 可用工具
${toolList}

## 注意事項
1. 每次只能呼叫一個工具
2. Action Input 必須是有效的 JSON 格式
3. 使用繁體中文回答使用者
4. 如果工具回傳錯誤，嘗試解釋或使用其他方法
5. 對於列表類的結果，整理成易讀的格式
${defaultProject ? `6. 當需要專案名稱但使用者沒有指定時，使用預設專案 "${defaultProject}"` : ""}

## 範例

使用者: 列出所有專案
Thought: 使用者想知道有哪些專案。我需要呼叫 core_list_projects 來取得專案列表。
Action: core_list_projects
Action Input: {}

[等待 Observation]

Observation: [{"name": "dev", "state": "wellFormed"}, {"name": "test", "state": "wellFormed"}]

Thought: 我已經取得專案列表，現在可以回答使用者了。
Final Answer: 您的組織中有 2 個專案：
1. **dev** - 狀態正常
2. **test** - 狀態正常
`;
}
