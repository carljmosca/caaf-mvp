
/*
 * Copyright 2025 Mosca IT LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

    private async waitForMcpServer(timeoutMs = 60000): Promise<void> {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (typeof (window as any).mcpHandleRequest === 'function') {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error("MCP Server initialization timed out.");
    }

    async sendRequest(method: string, params: any = null): Promise<any> {
        await this.waitForMcpServer();
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
        const response = await this.sendRequest('tools/list');
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
