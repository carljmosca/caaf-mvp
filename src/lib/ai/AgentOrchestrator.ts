import { McpClientWrapper } from "../mcp/McpClient";
import { GraniteService } from "./GraniteService";

export class AgentOrchestrator {
    private mcpClient: McpClientWrapper;
    private graniteService: GraniteService;

    constructor(mcpClient: McpClientWrapper, graniteService: GraniteService) {
        this.mcpClient = mcpClient;
        this.graniteService = graniteService;
    }

    async processMessage(message: string): Promise<string> {
        // 1. Check if we have tools available
        // For MVP, we'll just pass the message to Granite.
        // In a real implementation, we would:
        // a. Ask Granite if it needs to use a tool based on the message and available tools.
        // b. If yes, execute the tool via McpClient.
        // c. Feed the tool output back to Granite.

        // Simple heuristic for MVP: if message starts with "use tool", try to parse it.
        if (message.toLowerCase().startsWith("use tool")) {
            const parts = message.split(" ");
            if (parts.length >= 3) {
                const toolName = parts[2];
                const args = parts.slice(3).join(" ");
                try {
                    // Assuming args is JSON, if not, pass as string in a default arg?
                    // For simplicity, let's assume no args or simple string.
                    const result = await this.mcpClient.callTool(toolName, { query: args });
                    return `Tool '${toolName}' output: ${JSON.stringify(result)}`;
                } catch (e: any) {
                    return `Error executing tool '${toolName}': ${e.message}`;
                }
            }
        }

        // Default: Chat with Granite
        return await this.graniteService.generate(message);
    }
}
