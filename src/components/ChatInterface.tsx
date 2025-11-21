import React, { useState } from 'react';
import { Send, Cpu } from 'lucide-react';
import { McpClientWrapper } from '../lib/mcp/McpClient';
import { GraniteService } from '../lib/ai/GraniteService';
import { AgentOrchestrator } from '../lib/ai/AgentOrchestrator';
import { ToolStatus } from './ToolStatus';

interface Message {
    role: 'user' | 'agent';
    content: string;
}

export const ChatInterface: React.FC = () => {
    console.log("ChatInterface loaded - Version: BLACK-WHITE-SIMPLE");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [mcpClient] = useState(() => new McpClientWrapper());
    const [graniteService] = useState(() => new GraniteService("lm-studio", "/api/ai/v1/chat/completions"));
    const [orchestrator] = useState(() => new AgentOrchestrator(mcpClient, graniteService));
    const [isConnected, setIsConnected] = useState(false);
    const [mcpUrl, setMcpUrl] = useState('http://localhost:3000/mcp');
    const [transportType, setTransportType] = useState<'ws' | 'http'>('http');
    const [tools, setTools] = useState<any[]>([]);

    const handleConnect = async () => {
        try {
            await mcpClient.connect(mcpUrl, transportType);
            setIsConnected(true);

            // Try to list available tools to verify the connection works
            try {
                const toolsResponse = await mcpClient.listTools();
                console.log('Available MCP tools:', toolsResponse);
                const discoveredTools = toolsResponse.tools || [];
                setTools(discoveredTools);
                setMessages(prev => [...prev, {
                    role: 'agent',
                    content: `Connected to MCP Server! Found ${discoveredTools.length} tools.`
                }]);
            } catch (toolError) {
                console.error('Failed to list tools:', toolError);
                setMessages(prev => [...prev, {
                    role: 'agent',
                    content: 'Connected to MCP Server, but failed to list tools.'
                }]);
            }
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'agent', content: 'Failed to connect to MCP Server.' }]);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsProcessing(true);

        try {
            const response = await orchestrator.processMessage(input);
            setMessages(prev => [...prev, { role: 'agent', content: response }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'agent', content: 'Error processing message.' }]);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex h-screen vibrant-bg text-white font-sans">
            {/* Sidebar for Tools */}
            {isConnected && (
                <div className="w-80 border-r vibrant-border bg-slate-950/40 backdrop-blur-xl overflow-y-auto shadow-2xl shadow-blue-500/10">
                    <ToolStatus tools={tools} />
                </div>
            )}

            {/* Main Chat Area */}
            <div className="flex flex-col flex-1">
                {/* Header */}
                <header className="flex items-center justify-between p-5 border-b vibrant-border bg-slate-950/40 backdrop-blur-xl sticky top-0 z-10 shadow-lg shadow-blue-500/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 vibrant-icon-box rounded-xl">
                            <Cpu className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold vibrant-text">
                                CAAF Orchestrator
                            </h1>
                            <p className="text-xs text-gray-400">AI Agent Framework</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${isConnected
                            ? 'status-connected'
                            : 'status-disconnected'
                            }`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50' : 'bg-rose-400'}`} />
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </div>
                        {!isConnected && (
                            <div className="flex gap-2 items-center">
                                <select
                                    value={transportType}
                                    onChange={(e) => setTransportType(e.target.value as 'ws' | 'http')}
                                    className="bg-slate-900/50 border-2 border-blue-500/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all backdrop-blur-sm text-white"
                                >
                                    <option value="ws">WebSocket</option>
                                    <option value="http">HTTP</option>
                                </select>
                                <input
                                    type="text"
                                    value={mcpUrl}
                                    onChange={(e) => setMcpUrl(e.target.value)}
                                    className="bg-slate-900/50 border-2 border-blue-500/30 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all backdrop-blur-sm text-white placeholder-gray-500"
                                    placeholder="MCP Server URL"
                                />
                                <button
                                    onClick={handleConnect}
                                    className="vibrant-gradient-btn text-white px-5 py-2 rounded-lg text-sm font-bold transition-all"
                                >
                                    Connect
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="p-8 bg-gradient-to-br from-blue-500/10 via-blue-400/10 to-blue-600/10 rounded-3xl border-2 border-blue-500/20 backdrop-blur-sm shadow-2xl shadow-blue-500/20">
                                <Cpu className="w-24 h-24 mb-4 text-blue-400/60 mx-auto animate-pulse" />
                                <p className="text-gray-300 text-center font-medium">Start a conversation with your AI agent...</p>
                            </div>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-xl ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 text-white rounded-br-sm shadow-blue-500/50 font-medium'
                                : 'bg-slate-900/60 text-white rounded-bl-sm border-2 border-blue-500/20 backdrop-blur-sm shadow-blue-500/20'
                                }`}>
                                <p className="leading-relaxed">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isProcessing && (
                        <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-slate-900/60 rounded-2xl rounded-bl-sm px-5 py-3 border-2 border-blue-500/20 backdrop-blur-sm flex items-center gap-2 shadow-xl shadow-blue-500/20">
                                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce shadow-lg shadow-cyan-400/50" style={{ animationDelay: '0ms' }} />
                                <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce shadow-lg shadow-blue-400/50" style={{ animationDelay: '150ms' }} />
                                <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce shadow-lg shadow-pink-400/50" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-5 border-t border-blue-500/20 bg-slate-950/40 backdrop-blur-xl shadow-2xl shadow-blue-500/10">
                    <div className="flex gap-3 max-w-4xl mx-auto">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type your message..."
                            className="flex-1 bg-slate-900/50 border-2 border-blue-500/30 rounded-xl px-5 py-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all backdrop-blur-sm placeholder-gray-500 text-white shadow-lg shadow-blue-500/10"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isProcessing || !input.trim()}
                            className="vibrant-gradient-btn disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all disabled:shadow-none flex items-center justify-center min-w-[3rem] disabled:hover:scale-100"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
