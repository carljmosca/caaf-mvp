import { McpClientWrapper } from "../mcp/McpClient";
import { TransformersService } from "./TransformersService";

export class AgentOrchestrator {
    private mcpClient: McpClientWrapper;
    private aiService: TransformersService;

    constructor(mcpClient: McpClientWrapper, aiService: TransformersService) {
        this.mcpClient = mcpClient;
        this.aiService = aiService;
    }

    async processMessage(message: string, onProgress?: (progress: any) => void): Promise<string> {
        try {
            // 1. Fetch available tools
            let tools: any[] = [];
            try {
                const toolsList = await this.mcpClient.listTools();
                tools = toolsList.tools || [];
            } catch (error) {
                console.warn("Failed to list tools (likely not connected to MCP):", error);
                // Continue without tools
            }

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

            // 3. Call AI Model
            console.log("Sending prompt to AI:", systemPrompt);
            const response = await this.aiService.generate(systemPrompt, onProgress);
            console.log("AI response:", response);

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
                        // Check if the result has a 'result' property and use it if available
                        let outputDisplay = `Output: ${JSON.stringify(toolResult, null, 2)}`;

                        // Helper to extract result
                        let extractedResult = undefined;

                        if (toolResult && typeof toolResult === 'object') {
                            // 1. Check top-level 'result'
                            if ('result' in toolResult) {
                                extractedResult = (toolResult as any).result;
                            }
                            // 2. Check 'structuredContent.result' (as seen in some implementations)
                            else if ('structuredContent' in toolResult && (toolResult as any).structuredContent?.result) {
                                extractedResult = (toolResult as any).structuredContent.result;
                            }
                            // 3. Check inside 'content' array if it contains a JSON string with 'result'
                            else if ('content' in toolResult && Array.isArray((toolResult as any).content)) {
                                for (const item of (toolResult as any).content) {
                                    if (item.type === 'text' && item.text) {
                                        try {
                                            const parsedText = JSON.parse(item.text);
                                            if (parsedText && typeof parsedText === 'object' && 'result' in parsedText) {
                                                extractedResult = parsedText.result;
                                                break;
                                            }
                                        } catch (e) {
                                            // Not JSON, continue
                                        }
                                    }
                                }
                            }
                        }

                        if (extractedResult !== undefined) {
                            outputDisplay = typeof extractedResult === 'string' ? extractedResult : JSON.stringify(extractedResult, null, 2);
                        }

                        return `Tool '${parsed.tool}' executed successfully:\n${outputDisplay}`;
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
