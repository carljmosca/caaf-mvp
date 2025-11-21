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
        try {
            // 1. Fetch available tools
            const toolsList = await this.mcpClient.listTools();
            const tools = toolsList.tools || [];

            // 2. Construct System Prompt
            let systemPrompt = `You are a helpful AI assistant. You have access to the following tools:\n\n`;

            if (tools.length > 0) {
                tools.forEach((t: any) => {
                    systemPrompt += `- ${t.name}: ${t.description || "No description provided."}\n`;
                    systemPrompt += `  Schema: ${JSON.stringify(t.inputSchema)}\n`;
                });
                systemPrompt += `\nIMPORTANT: If the user's request requires a tool, you MUST respond ONLY with a JSON object. Do not add any other text.\n`;
                systemPrompt += `Use this format:\n`;
                systemPrompt += `{ "tool": "tool_name", "arguments": { "arg_name": "value" } }\n\n`;
                systemPrompt += `Examples:\n`;
                systemPrompt += `User: "Add 5 and 3"\n`;
                systemPrompt += `Assistant: { "tool": "add", "arguments": { "a": 5, "b": 3 } }\n\n`;
                systemPrompt += `User: "Hi there"\n`;
                systemPrompt += `Assistant: Hello! How can I help you today?\n\n`;
                systemPrompt += `If no tool is needed, respond normally in plain text.\n`;
            } else {
                systemPrompt += "No tools are currently available. Respond normally in plain text.\n";
            }

            systemPrompt += `\nUser Message: ${message}`;

            // 3. Call Granite
            console.log("Sending prompt to Granite:", systemPrompt);
            const response = await this.graniteService.generate(systemPrompt);
            console.log("Granite response:", response);

            // 4. Parse Response
            try {
                // Attempt to find JSON in the response (in case there's extra text)
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const potentialJson = jsonMatch[0];
                    const parsed = JSON.parse(potentialJson);

                    if (parsed.tool && parsed.arguments) {
                        console.log(`Executing tool: ${parsed.tool}`);
                        const toolResult = await this.mcpClient.callTool(parsed.tool, parsed.arguments);

                        // Optional: Feed tool result back to Granite for a final natural language response
                        // For MVP, we'll just return the tool output formatted nicely
                        return `Tool '${parsed.tool}' executed successfully.\nOutput: ${JSON.stringify(toolResult, null, 2)}`;
                    }
                }
            } catch (e) {
                // Not JSON or invalid format, treat as normal text
                console.log("Response was not a valid tool call, returning as text.");
            }

            return response;

        } catch (error: any) {
            console.error("Error in AgentOrchestrator:", error);
            return `Error processing request: ${error.message}`;
        }
    }
}
