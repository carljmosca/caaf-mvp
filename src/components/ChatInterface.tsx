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

import React, { useState, useEffect } from 'react';
import { Menu, Bot } from 'lucide-react';
import { McpClientWrapper } from '../lib/mcp/McpClient';
import { TransformersService } from '../lib/ai/TransformersService';
import { AgentOrchestrator } from '../lib/ai/AgentOrchestrator';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ModelLoader } from './ModelLoader';
import { SettingsModal } from './SettingsModal';
import type { Message } from './ChatMessage';

// Define internal AgentResponse type matching the orchestrator's return
type AgentResponse = {
    response: string;
    modelSelectSeconds: string;
    toolCallSeconds: string | null;
    totalSeconds: string;
};

export const ChatInterface: React.FC = () => {
    // Ref for ChatInput focus
    const chatInputRef = React.useRef<HTMLTextAreaElement>(null);
    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [mcpClient, setMcpClient] = useState(() => new McpClientWrapper());
    const [aiService] = useState(() => new TransformersService());
    const [orchestrator, setOrchestrator] = useState(() => new AgentOrchestrator(mcpClient, aiService));
    const [isConnected, setIsConnected] = useState(false);
    const [tools, setTools] = useState<any[]>([]);
    const [selectedModel, setSelectedModel] = useState('onnx-community/granite-4.0-micro-ONNX-web');
    const [downloadProgress, setDownloadProgress] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // UI State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Initialization State
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [initProgress, setInitProgress] = useState<any>(null);

    // Initial connection logic
    useEffect(() => {
        const initializeSystem = async () => {
            // 1. Initialize Model
            try {
                await aiService.initialize((progress) => {
                    setInitProgress(progress);
                });
                setIsModelLoaded(true);
                setTimeout(() => { chatInputRef.current?.focus(); }, 0);
            } catch (e) {
                console.error("Failed to load model", e);
                setInitProgress({ status: 'error', error: 'Failed to load model' });
                return;
            }

            // 2. Connect to MCP
            setIsConnected(false);
            setTools([]);

            // Add system status message
            setMessages(prev => {
                const filtered = prev.filter(m => !m.content.startsWith('Connecting to MCP Server'));
                return [...filtered, { role: 'agent', content: 'Connecting to MCP Server...' }];
            });

            const client = new McpClientWrapper();
            setMcpClient(client);
            setOrchestrator(new AgentOrchestrator(client, aiService));
            setIsConnected(true);

            try {
                const toolsResponse = await client.listTools();
                console.log('listTools response:', toolsResponse);
                const discoveredTools = Array.isArray(toolsResponse)
                    ? toolsResponse
                    : (toolsResponse.result && toolsResponse.result.tools) ? toolsResponse.result.tools : [];

                setTools(discoveredTools);

                // Update status message with tool results
                setMessages(prev => {
                    const filtered = prev.filter(m =>
                        m.content !== 'Connecting to MCP Server...' &&
                        !m.content.startsWith('MCP Server connected')
                    );
                    const toolList = discoveredTools.map((t: any) => `• ${t.name}: ${t.description || 'No description'}`).join('\n');
                    const newMsg: Message = {
                        role: 'agent',
                        content: `MCP Server connected.\nFound ${discoveredTools.length} tools:\n${toolList}`
                    };
                    return [...filtered, newMsg];
                });
            } catch (toolError) {
                console.error('Error in tool discovery:', toolError);
                setMessages(prev => {
                    const filtered = prev.filter(m => m.content !== 'Connecting to MCP Server...');
                    return [...filtered, {
                        role: 'agent',
                        content: 'MCP Server connected, but failed to list tools.'
                    }];
                });
            }
        };

        initializeSystem();
        return () => {
            mcpClient.disconnect();
        };
    }, [aiService]);

    const handleModelChange = async (modelId: string) => {
        if (isProcessing) return;
        setSelectedModel(modelId);
        setIsSettingsOpen(false); // Close modal on selection
        setIsModelLoaded(false);
        setInitProgress({ status: 'initiating', file: 'Switching model...' });

        try {
            await aiService.setModel(modelId);
            await aiService.initialize((progress) => setInitProgress(progress));
            setMessages(prev => [...prev, {
                role: 'agent',
                content: `Switched model.`
            }]);
            setTimeout(() => { chatInputRef.current?.focus(); }, 0);
        } catch (e) {
            console.error("Failed to switch model", e);
        } finally {
            setIsModelLoaded(true);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || tools.length === 0) return;
        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput('');
        setIsProcessing(true);

        try {
            setDownloadProgress(null);
            const result: AgentResponse = await orchestrator.processMessage(currentInput, (progress) => {
                setDownloadProgress(progress);
            });

            let timing = '';
            if (result.toolCallSeconds) {
                timing = `Tool selection: ${result.modelSelectSeconds}s | Tool exec: ${result.toolCallSeconds}s | Total: ${result.totalSeconds}s`;
            } else {
                timing = `Total time: ${result.totalSeconds}s`;
            }

            setMessages(prev => [...prev, {
                role: 'agent',
                content: result.response,
                timing: timing
            }]);
            setTimeout(() => { chatInputRef.current?.focus(); }, 0);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'agent', content: 'Error processing message.' }]);
        } finally {
            setIsProcessing(false);
            setDownloadProgress(null);
        }
    };

    const handleNewChat = () => {
        if (isProcessing) return;
        setMessages([]);
        setInput('');
        setDownloadProgress(null);
        setIsSidebarOpen(false);
        setTimeout(() => { chatInputRef.current?.focus(); }, 0);
    };

    // Show Loader if model is not ready
    if (!isModelLoaded) {
        return <ModelLoader progress={initProgress} />;
    }

    return (
        <div className="flex h-screen bg-[#131314] text-[#E3E3E3] font-sans overflow-hidden">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onNewChat={handleNewChat}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
                isProcessing={isProcessing}
                isConnected={isConnected}
                toolsCount={tools.length}
            />

            <main className="flex-1 flex flex-col h-full relative w-full">
                {/* Minimal Header */}
                <header className="flex items-center justify-between px-4 py-3 bg-[#131314] sticky top-0 z-10">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-[#E3E3E3] hover:bg-[#2D2E2F] rounded-full transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#E3E3E3] opacity-80">Local Agent</span>
                        <Bot className="w-4 h-4 text-gemini-gradient" />
                    </div>

                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white cursor-default">
                        C
                    </div>
                </header>

                <MessageList
                    messages={messages}
                    isProcessing={isProcessing}
                    downloadProgress={downloadProgress}
                />

                <ChatInput
                    ref={chatInputRef}
                    input={input}
                    setInput={setInput}
                    onSend={handleSend}
                    isProcessing={isProcessing}
                    isDisabled={tools.length === 0 || isProcessing}
                    placeholder={tools.length === 0 ? "Initialising system..." : "Ask me anything"}
                />
            </main>
        </div>
    );
}

export default ChatInterface;
