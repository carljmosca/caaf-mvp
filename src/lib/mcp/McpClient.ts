
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export class McpClientWrapper {
    private client: Client;
    private transport: WebSocketClientTransport | StreamableHTTPClientTransport | null = null;

    constructor() {
        this.client = new Client(
            {
                name: "caaf-mvp-client",
                version: "1.0.0",
            },
            {
                capabilities: {},
            }
        );
    }

    async connect(url: string, type: 'ws' | 'http' = 'ws') {
        try {
            const fullUrl = new URL(url, window.location.origin);
            if (type === 'ws') {
                this.transport = new WebSocketClientTransport(fullUrl);
            } else {
                this.transport = new StreamableHTTPClientTransport(fullUrl);
            }

            if (this.transport) {
                await this.client.connect(this.transport);
                console.log(`MCP Client connected successfully to ${url} via ${type}`);
            }
        } catch (error) {
            console.error("MCP Client connection failed:", error);
            throw error;
        }
    }

    async listTools() {
        return await this.client.listTools();
    }

    async callTool(name: string, args: any) {
        return await this.client.callTool({
            name,
            arguments: args,
        });
    }

    async disconnect() {
        if (this.transport) {
            await this.transport.close();
        }
    }
}
