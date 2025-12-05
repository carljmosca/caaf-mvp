
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

let requestId = 1;

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

    formatJSON(obj: any): string {
        return JSON.stringify(obj, null, 2)
            .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
            .replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>')
            .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
            .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>');
    }

    displayOutput(data: any): void {
        const output = document.getElementById('output');
        if (!output) return;

        if (typeof data === 'object') {
            output.innerHTML = this.formatJSON(data);
        } else {
            output.textContent = String(data);
        }
    }

    sendRequest(method: string, params: any = null): any {
        const request: any = {
            jsonrpc: "2.0",
            id: requestId++,
            method: method
        };

        if (params) {
            request.params = params;
        }

        const requestJSON = JSON.stringify(request);
        console.log('Sending request:', requestJSON);

        const responseJSON = (window as any).mcpHandleRequest(requestJSON);
        console.log('Received response:', responseJSON);

        const response = JSON.parse(responseJSON);
        this.displayOutput(response);

        return response;
    }



    async listTools() {
        // If sendRequest is synchronous, wrap in Promise.resolve for compatibility
        const response = await Promise.resolve(this.sendRequest('tools/list'));
        return response;
    }

    async callTool(name: string, args: any) {
        return this.sendRequest('tools/call', {
            name: name,
            arguments: args
        });
    }

    async disconnect() {
        if (this.transport) {
            await this.transport.close();
        }
    }
}
