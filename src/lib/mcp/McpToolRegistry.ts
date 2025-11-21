export interface Tool {
    name: string;
    description?: string;
    inputSchema?: any;
}

export class McpToolRegistry {
    private tools: Map<string, Tool> = new Map();

    registerTool(tool: Tool) {
        this.tools.set(tool.name, tool);
    }

    getTool(name: string) {
        return this.tools.get(name);
    }

    getAllTools() {
        return Array.from(this.tools.values());
    }

    clear() {
        this.tools.clear();
    }
}
