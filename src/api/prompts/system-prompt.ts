// Copyright (c) TMC Ltd.
// Licensed under the MIT License.

import { MCPBridge } from "../services/mcp-bridge.js";

const mcpBridge = new MCPBridge();
const tools = mcpBridge.getAvailableTools();

const toolDescriptions: Record<string, string> = {
    core_list_projects: "列出組織中的所有專案",
    core_list_project_teams: "列出專案中的團隊。參數: project (專案名稱)",
    repo_list_repos_by_project: "列出專案中的儲存庫。參數: project (專案名稱)",
    pipelines_get_builds: "取得建置紀錄。參數: project (專案名稱), top (數量，預設10)",
    pipelines_get_build_definitions: "取得 Pipeline 定義。參數: project (專案名稱)",
    wit_get_work_item: "取得工作項目詳情。參數: project (專案名稱), id (工作項目ID)",
    search_workitem: "搜尋工作項目。參數: project (專案名稱), query (搜尋關鍵字)",
};

export function getSystemPrompt(project?: string): string {
    const toolList = tools
        .map((t) => `- ${t}: ${toolDescriptions[t] || "Azure DevOps 工具"}`)
        .join("\n");

    let prompt = `你是 TMC DevOps AI 助手，專門協助使用者與 Azure DevOps 互動。`;

    if (project) {
        prompt += `\n\n## 當前專案上下文\n使用者已選擇專案: "${project}"。\n當工具需要 "project" 參數時，優先使用此值，除非使用者明確指定其他專案。`;
    }

    prompt += `\n\n## 回應格式
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
`;

    return prompt;
}
