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
        let response: string = "";
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

            // 2. Construct systemPrompt with dynamic tool listing
            let systemPrompt = `You are a helpful, expert server assistant capable of utilizing external tools to answer user queries (as opposed to answering them yourself).`;
            systemPrompt += ` Your primary function is to analyze the user's request and determine if one of the AVAILABLE TOOLS is appropriate to answer the query.`;
            systemPrompt += ` The use of a tool should be given priority. If an appropriate tool is available, your entire response MUST be a valid JSON object matching the Tool Use Request Format. DO NOT output any other text or explanation.`;
            systemPrompt += ` If NONE of the tools are relevant to the user's request, you MUST NOT output any JSON or tool call. Only respond with conversational text.\n\n`;
            systemPrompt += `**INSTRUCTION:** If a tool is to be utilized, your entire response MUST ONLY be a valid JSON object matching the Tool Use Request Format. DO NOT output any other text or explanation. If no tool is appropriate, you MUST NOT output any JSON or tool call. Only respond with conversational text.\n\n`;
            systemPrompt += `**EXAMPLES:**\n`;
            systemPrompt += `User: What is your name?\nAssistant: My name is GitHub Copilot.\n`;
            systemPrompt += `User: What time is it?\nAssistant: {\n  "tool_name": "current_time",\n  "tool_arguments": {}\n}\n`;
            systemPrompt += '**Tool Use Request Format (MANDATORY JSON SCHEMA):**\n';
            systemPrompt += '{\n  "tool_name": "<name_of_tool_to_use>",\n  "tool_arguments": {\n    "<argument_name>": "<value>",\n    ...\n  }\n}\n\n';
            systemPrompt += '**AVAILABLE TOOLS:**\n\n';
            tools.forEach((tool, idx) => {
                systemPrompt += `${idx + 1}.  **Tool Name: ${tool.name}**\n`;
                systemPrompt += `    * Description: ${tool.description || 'No description provided.'}\n`;
                if (tool.inputSchema && tool.inputSchema.properties && Object.keys(tool.inputSchema.properties).length > 0) {
                    systemPrompt += `    * Arguments:`;
                    type ArgSchema = { type?: string; description?: string; [key: string]: any };
                    Object.entries(tool.inputSchema.properties as Record<string, ArgSchema>).forEach(([arg, schema]) => {
                        const argType = schema.type || 'unknown';
                        const argDesc = schema.description || '';
                        systemPrompt += `\n        * ${arg} (${argType}): ${argDesc}`;
                    });
                    systemPrompt += '\n';
                } else {
                    systemPrompt += '    * Arguments: None.\n';
                }
                systemPrompt += '\n';
            });

            const messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ];
            console.log("Sending messages to AI service:", messages);
            response = await this.aiService.generate(messages, onProgress);
            console.log("AI service response:", response);

            // Only extract trailing JSON if the last character is a closing brace
            function extractTrailingJsonObject(text: string): any | null {
                text = text.trim();
                if (!text.endsWith('}')) return null;
                // Find the start of the trailing JSON object
                let stack = 0;
                for (let i = text.length - 1; i >= 0; i--) {
                    if (text[i] === '}') stack++;
                    else if (text[i] === '{') stack--;
                    if (stack === 0) {
                        const candidate = text.slice(i);
                        try {
                            const parsed = JSON.parse(candidate);
                            if (parsed && parsed.tool_name) return parsed;
                        } catch (e) {
                            // Not valid JSON
                        }
                        break;
                    }
                }
                return null;
            }

            const lastValidJson = extractTrailingJsonObject(response);

            if (lastValidJson && lastValidJson.tool_name) {
                console.log(`Executing tool: ${lastValidJson.tool_name}`);
                // Use empty object if tool_arguments is missing or not an object
                let args = {};
                if (lastValidJson.tool_arguments && typeof lastValidJson.tool_arguments === 'object') {
                    args = lastValidJson.tool_arguments;
                }
                const toolResult = await this.mcpClient.callTool(lastValidJson.tool_name, args);

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

                return `Response from '${lastValidJson.tool_name}':\n${outputDisplay}`;
            }
        } catch (e) {
            // Not JSON or invalid format, treat as normal text
            console.log("Response was not a valid tool call, returning as text.");
        }

        // Fallback: If no valid trailing JSON, return only the last part of the response string that follows the word "assistant"
        try {
            let lowerResponse = response.toLowerCase();
            let idx = lowerResponse.lastIndexOf("assistant");
            if (idx !== -1) {
                // Return everything after "assistant"
                return response.slice(idx + "assistant".length).trim();
            }
        } catch (e) {
            // If any error, fallback to full response
        }
        // Fallback: return full response
        return response;
    }
}
