// Copyright (c) TMC Ltd.
// Licensed under the MIT License.

import { WebApi, getBasicHandler, getBearerHandler } from "azure-devops-node-api";
import { logger } from "../../logger.js";

type ToolHandler = (params: Record<string, unknown>) => Promise<unknown>;

export class MCPBridge {
    private connection: WebApi | null = null;
    private toolHandlers: Map<string, ToolHandler> = new Map();

    constructor() {
        this.initConnection();
        this.registerTools();
    }

    private initConnection() {
        const token = process.env.ADO_MCP_AUTH_TOKEN;
        const orgUrl = `https://dev.azure.com/${process.env.ADO_ORG || "isosoman0009"}`;

        if (token) {
            const authHandler = getBearerHandler(token);
            this.connection = new WebApi(orgUrl, authHandler);
            logger.info(`MCPBridge connected to ${orgUrl}`);
        } else {
            logger.warn("ADO_MCP_AUTH_TOKEN not set, MCP bridge will not work");
        }
    }

    private registerTools() {
        // Core tools
        this.toolHandlers.set("core_list_projects", async (params) => {
            if (!this.connection) throw new Error("Not connected to Azure DevOps");
            const coreApi = await this.connection.getCoreApi();
            const projects = await coreApi.getProjects();
            return projects.map((p) => ({
                id: p.id,
                name: p.name,
                state: p.state,
                lastUpdateTime: p.lastUpdateTime,
            }));
        });

        this.toolHandlers.set("core_list_project_teams", async (params) => {
            if (!this.connection) throw new Error("Not connected to Azure DevOps");
            const project = (params.project as string) || process.env.DEFAULT_PROJECT;
            if (!project) throw new Error("Project parameter is required");
            const coreApi = await this.connection.getCoreApi();
            return await coreApi.getTeams(project);
        });

        // Repository tools
        this.toolHandlers.set("repo_list_repos_by_project", async (params) => {
            if (!this.connection) throw new Error("Not connected to Azure DevOps");
            const project = (params.project as string) || process.env.DEFAULT_PROJECT;
            if (!project) throw new Error("Project parameter is required");
            const gitApi = await this.connection.getGitApi();
            return await gitApi.getRepositories(project);
        });

        // Pipeline tools
        this.toolHandlers.set("pipelines_get_builds", async (params) => {
            if (!this.connection) throw new Error("Not connected to Azure DevOps");
            const project = (params.project as string) || process.env.DEFAULT_PROJECT;
            if (!project) throw new Error("Project parameter is required");
            const top = (params.top as number) || 10;
            const buildApi = await this.connection.getBuildApi();
            return await buildApi.getBuilds(project, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, top);
        });

        this.toolHandlers.set("pipelines_get_build_definitions", async (params) => {
            if (!this.connection) throw new Error("Not connected to Azure DevOps");
            const project = (params.project as string) || process.env.DEFAULT_PROJECT;
            if (!project) throw new Error("Project parameter is required");
            const buildApi = await this.connection.getBuildApi();
            return await buildApi.getDefinitions(project);
        });

        // Work item tools
        this.toolHandlers.set("wit_get_work_item", async (params) => {
            if (!this.connection) throw new Error("Not connected to Azure DevOps");
            const id = params.id as number;
            const project = (params.project as string) || process.env.DEFAULT_PROJECT;
            // project is optional for getWorkItem but good to have
            const witApi = await this.connection.getWorkItemTrackingApi();
            return await witApi.getWorkItem(id, undefined, undefined, undefined, project);
        });

        // Search work items by title (handles empty query by listing all)
        this.toolHandlers.set("search_workitem", async (params) => {
            if (!this.connection) throw new Error("Not connected to Azure DevOps");
            const project = (params.project as string) || process.env.DEFAULT_PROJECT;
            if (!project) throw new Error("Project parameter is required");
            const query = params.query as string;
            const witApi = await this.connection.getWorkItemTrackingApi();

            // Build query - if search term is empty, list all; otherwise search by title
            let queryStr = `SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.TeamProject] = '${project}'`;
            if (query && query.trim() !== "") {
                queryStr += ` AND [System.Title] CONTAINS '${query}'`;
            }
            queryStr += ` ORDER BY [System.ChangedDate] DESC`;

            const wiqlQuery = { query: queryStr };
            return await witApi.queryByWiql(wiqlQuery, { project });
        });

        logger.info(`Registered ${this.toolHandlers.size} MCP tools`);
    }

    async executeAction(
        actionName: string,
        params: Record<string, unknown>
    ): Promise<unknown> {
        const handler = this.toolHandlers.get(actionName);

        if (!handler) {
            throw new Error(`Unknown action: ${actionName}. Available actions: ${Array.from(this.toolHandlers.keys()).join(", ")}`);
        }

        logger.info(`Executing action: ${actionName}`, params);
        return await handler(params);
    }

    getAvailableTools(): string[] {
        return Array.from(this.toolHandlers.keys());
    }
}
