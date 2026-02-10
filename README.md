# ⭐ TMC DevOps MCP Server (Internal)

這是 **TMC 內部專用** 的 Azure DevOps MCP Server，提供超過 **82+** 個 MCP 工具，讓您可以透過自然語言與 Azure DevOps 互動。
本專案包含：
1. **MCP Server**：標準 Model Context Protocol 伺服器
2. **Web Chatbot**：內建的 AI 助理介面 (Port 3000)

## 🚀 快速開始 (Quick Start)

### 1. 給開發者 (Developers)

如果您需要修改程式碼或進行二次開發：

```bash
# 1. 下載專案
git clone <repo-url>
cd tmc-devops-mcp

# 2. 安裝依賴
npm install

# 3. 設定環境變數
cp .env.example .env
# 編輯 .env 填入 ADO_MCP_AUTH_TOKEN

# 4. 編譯
npm run build

# 5. 啟動 (同時啟動 API Server + Web UI)
npm run dev
# Web UI: http://localhost:3000
# API: http://localhost:3001
```

### 2. 給一般使用者 (Users)

如果您只是想在 Cline / Cursor 中使用此 MCP Server：

#### 設定 `mcp.json`

請在您的專案根目錄 `.vscode/mcp.json` (或全域設定) 加入以下內容：

```json
{
  "mcpServers": {
    "tmc-devops": {
      "command": "node",
      "args": [
        "/path/to/your/tmc-devops-mcp/dist/index.js",
        "YourOrgName",
        "--authentication",
        "envvar"
      ],
      "env": {
        "ADO_MCP_AUTH_TOKEN": "YOUR_PAT_TOKEN"
      }
    }
  }
}
```

> 💡 **注意**：
> 1. 請將 `/path/to/your/tmc-devops-mcp/dist/index.js` 替換為實際的路徑。
> 2. `YourOrgName` 替換為您的 ADO 組織名稱。
> 3. `YOUR_PAT_TOKEN` 建議使用環境變數管理，不要直接寫死在設定檔中。

## 🛠️ 功能列表

本 Server 支援以下領域的工具 (共 82+ 個)：

- **Core**: 專案 (Project)、團隊 (Team) 管理
- **Work Items**: 建立、更新、查詢工作項目 (Task, Bug, User Story)
- **Repos**: Git 儲存庫、Pull Requests 管理
- **Pipelines**: 建置 (Build)、發布 (Release) 查詢與觸發
- **Wiki**: 知識庫搜尋與內容讀取

## 📝 開發指南

- **編譯**: `npm run build`
- **測試 API**: `npm run api` (啟動後可透過 `curl` 測試 `localhost:3001`)
- **Web UI 開發**: `cd web && npm run dev`

---

## License

Licensed under the [MIT License](./LICENSE.md).

<!--
User Notes:
tmc-devops-mcp / wit_add_child_work_items
{
  "items": [
    {
      "description": "",
      "title": "sldkfjsldkfjsldfkj"
    }
  ],
  "parentId": 15,
  "project": "dev",
  "workItemType": "Task"
}
-->