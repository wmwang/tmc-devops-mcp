// Copyright (c) TMC Ltd.
// Licensed under the MIT License.

import { Router, Request, Response } from "express";
import { MCPBridge } from "../services/mcp-bridge.js";
import { logger } from "../../logger.js";

export const projectsRouter = Router();

const mcpBridge = new MCPBridge();

projectsRouter.get("/", async (req: Request, res: Response) => {
    try {
        const result = await mcpBridge.executeAction("core_list_projects", {});
        res.json(result);
    } catch (error) {
        logger.error("Error listing projects:", error);
        res.status(500).json({ error: "Failed to list projects" });
    }
});
