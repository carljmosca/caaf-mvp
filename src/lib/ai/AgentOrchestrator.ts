export interface AgentResponse {
    response: string;
    modelSelectSeconds: string;
    toolCallSeconds: string | null;
    totalSeconds: string;
}
import { McpClientWrapper } from "../mcp/McpClient";
import { TransformersService } from "./TransformersService";

export class AgentOrchestrator {
    private mcpClient: McpClientWrapper;
    private aiService: TransformersService;

    constructor(mcpClient: McpClientWrapper, aiService: TransformersService) {
        this.mcpClient = mcpClient;
        this.aiService = aiService;
    }

async processMessage(message: string, onProgress?: (progress: any) => void): Promise<AgentResponse> {
    let response: string = "";
    let modelSelectStart = performance.now();
    let modelSelectEnd = 0;
    let toolCallStart = 0;
    let toolCallEnd = 0;
    let tools: any[] = [];
    try {
        const toolsList = await this.mcpClient.listTools();
        tools = Array.isArray(toolsList)
            ? toolsList
            : (toolsList.result && toolsList.result.tools) ? toolsList.result.tools : [];
    } catch (error) {
        // Continue without tools
    }

    let systemPrompt = `You are a helpful, expert server assistant capable of utilizing external tools to answer user queries (as opposed to answering them yourself).`;
    systemPrompt += ` Your primary function is to analyze the user's request and determine if one of the AVAILABLE TOOLS is appropriate to answer the query.`;
    systemPrompt += ` The use of a tool should be given priority. If an appropriate tool is available, your entire response MUST be a valid JSON object matching the Tool Use Request Format. DO NOT output any other text or explanation.`;
    systemPrompt += ` DO NOT select a tool from the EXAMPLES list. If NONE of the AVAILABLE TOOLS are relevant to the user's request, you MUST NOT output any JSON or tool call. Only respond with conversational text.\n\n`;
    systemPrompt += `**INSTRUCTION:** If a tool is to be utilized, your entire response MUST ONLY be a valid JSON object matching the Tool Use Request Format. DO NOT output any other text or explanation. If no tool is appropriate, you MUST NOT output any JSON or tool call. Only respond with conversational text.\n\n`;
    systemPrompt += `**EXAMPLES:**\n`;
    systemPrompt += `User: What is your name?\nAssistant: My name is GitHub Copilot.\n`;
    if (tools.length > 0) {
        const tool = tools[0];
        let exampleArgs = '{}';
        if (tool.inputSchema && tool.inputSchema.properties && Object.keys(tool.inputSchema.properties).length > 0) {
            const argEntries = Object.entries(tool.inputSchema.properties).map(([arg, schema]) => {
                let val: string | number | boolean = '"example"';
                if ((schema as any).type === 'number') val = 0;
                else if ((schema as any).type === 'boolean') val = true;
                return `    "${arg}": ${typeof val === 'string' ? val : JSON.stringify(val)}`;
            });
            exampleArgs = `{\n${argEntries.join(',\n')}\n}`;
        }
        systemPrompt += `User: Use the tool '${tool.name}'.\nAssistant: {\n  "tool_name": "${tool.name}",\n  "tool_arguments": ${exampleArgs}\n}\n`;
    }
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
                const argType = (schema as any).type || 'unknown';
                const argDesc = (schema as any).description || '';
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
    response = await this.aiService.generate(messages, onProgress);
    modelSelectEnd = performance.now();

    let cleanedResponse = response.trim();
    const codeBlockRegex = /```(?:json)?\\s*([\\s\\S]*?)\\s*```/gi;
    cleanedResponse = cleanedResponse.replace(codeBlockRegex, (_, code) => code.trim());

    const lastValidJson = this.extractTrailingJsonObject(cleanedResponse);
    if (lastValidJson && lastValidJson.tool_name) {
        toolCallStart = performance.now();
        let args = {};
        if (lastValidJson.tool_arguments && typeof lastValidJson.tool_arguments === 'object') {
            args = lastValidJson.tool_arguments;
        }
        const toolResult = await this.mcpClient.callTool(lastValidJson.tool_name, args);
        toolCallEnd = performance.now();
        let outputDisplay = `Output: ${JSON.stringify(toolResult, null, 2)}`;
        let extractedResult = undefined;
        if (toolResult && typeof toolResult === 'object') {
            if ('result' in toolResult) {
                extractedResult = (toolResult as any).result;
            }
        }
        if (extractedResult !== undefined) {
            outputDisplay = typeof extractedResult === 'string' ? extractedResult : JSON.stringify(extractedResult, null, 2);
        }
        return {
            response: `Response from '${lastValidJson.tool_name}':\n${outputDisplay}`,
            modelSelectSeconds: ((modelSelectEnd - modelSelectStart) / 1000).toFixed(2),
            toolCallSeconds: ((toolCallEnd - toolCallStart) / 1000).toFixed(2),
            totalSeconds: ((toolCallEnd - modelSelectStart) / 1000).toFixed(2)
        };
    }
    const lowerResponse = response.toLowerCase();
    const idx = lowerResponse.lastIndexOf("assistant");
    let fallbackText = response;
    if (idx !== -1) {
        fallbackText = response.slice(idx + "assistant".length).trim();
    }
    const endTime = performance.now();
    return {
        response: fallbackText,
        modelSelectSeconds: ((endTime - modelSelectStart) / 1000).toFixed(2),
        toolCallSeconds: null,
        totalSeconds: ((endTime - modelSelectStart) / 1000).toFixed(2)
    };
}

    // Only extract trailing JSON if the last character is a closing brace
    private extractTrailingJsonObject(text: string): any | null {
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
}
