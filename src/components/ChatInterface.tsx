import React, { useState, useEffect } from 'react';
import { Send, Cpu, PlusCircle } from 'lucide-react';
import { McpClientWrapper } from '../lib/mcp/McpClient';
import { TransformersService } from '../lib/ai/TransformersService';
import { AgentOrchestrator } from '../lib/ai/AgentOrchestrator';
import type { AgentResponse } from '../lib/ai/AgentOrchestrator';
import { ToolStatus } from './ToolStatus';

interface Message {
    role: 'user' | 'agent';
    content: string;
}

export const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [mcpClient] = useState(() => new McpClientWrapper());
    const [aiService] = useState(() => new TransformersService());
    const [orchestrator] = useState(() => new AgentOrchestrator(mcpClient, aiService));
    const [isConnected, setIsConnected] = useState(false);
    const mcpUrl = 'http://localhost:3000/mcp';
    const transportType: 'ws' | 'http' = 'http';
    const [tools, setTools] = useState<any[]>([]);
    const [selectedModel, setSelectedModel] = useState('onnx-community/granite-4.0-micro-ONNX-web');
    const [downloadProgress, setDownloadProgress] = useState<any>(null);

    const AVAILABLE_MODELS = [
        { id: 'onnx-community/granite-4.0-micro-ONNX-web', name: 'Granite 4.0 Micro (800M) - Default' },
        { id: 'onnx-community/Llama-3.2-1B-Instruct', name: 'Llama 3.2 1B (Faster)' },
    ];

    const handleModelChange = async (modelId: string) => {
        if (isProcessing) return;
        setSelectedModel(modelId);
        await aiService.setModel(modelId);
        setMessages(prev => [...prev, {
            role: 'agent',
            content: `Switched to model: ${AVAILABLE_MODELS.find(m => m.id === modelId)?.name}`
        }]);
    };

    // Connect to MCP server automatically on startup
    useEffect(() => {
        let isMounted = true;
        const connectAndListTools = async () => {
            try {
                await mcpClient.connect(mcpUrl, transportType);
                if (!isMounted) return;
                setIsConnected(true);
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
        connectAndListTools();
        return () => {
            isMounted = false;
            mcpClient.disconnect();
        };
    }, []);


    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsProcessing(true);

        try {
            setDownloadProgress(null);
            const result: AgentResponse = await orchestrator.processMessage(input, (progress) => {
                setDownloadProgress(progress);
            });
            let timingInfo = '';
            if (result.toolCallSeconds) {
                timingInfo = `\n\n⏱️ Tool selection: ${result.modelSelectSeconds} s\n⏱️ MCP tool response: ${result.toolCallSeconds} s\n⏱️ Total response: ${result.totalSeconds} s`;
            } else {
                timingInfo = `\n\n⏱️ Total response: ${result.totalSeconds} s`;
            }
            setMessages(prev => [...prev, {
                role: 'agent',
                content: `${result.response}${timingInfo}`
            }]);
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
    };

    return (
        <div className="flex h-screen vibrant-bg text-white font-sans">
            {/* Sidebar for Tools */}
            {/* Sidebar for Tools */}
            <div className="w-80 min-w-[20rem] max-w-[20rem] border-r vibrant-border bg-slate-950/40 backdrop-blur-xl flex flex-col shadow-2xl shadow-blue-500/10">
                <div className="p-4 border-b border-blue-500/10 space-y-4">
                    <button
                        onClick={handleNewChat}
                        disabled={isProcessing}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium group"
                    >
                        <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        <span>New Chat</span>
                    </button>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-blue-300 uppercase tracking-wider ml-1">AI Model</label>
                        <select
                            value={selectedModel}
                            onChange={(e) => handleModelChange(e.target.value)}
                            disabled={isProcessing}
                            className="w-full bg-slate-900/50 border-2 border-blue-500/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all backdrop-blur-sm text-white disabled:opacity-50"
                        >
                            {AVAILABLE_MODELS.map(model => (
                                <option key={model.id} value={model.id}>{model.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isConnected ? (
                        <ToolStatus tools={tools} />
                    ) : (
                        <div className="p-6 text-center text-gray-500 text-sm">
                            <p>Connect to MCP Server to see available tools.</p>
                        </div>
                    )}
                </div>
            </div>

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
                        {/* Connection controls removed: now connects automatically on startup */}
                    </div>
                </header>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="p-8 bg-gradient-to-br from-blue-500/10 via-blue-400/10 to-blue-600/10 rounded-3xl border-2 border-blue-500/20 backdrop-blur-sm shadow-2xl shadow-blue-500/20">
                                <Cpu className="w-24 h-24 mb-4 text-blue-400/60 mx-auto animate-pulse" />
                                <p className="text-gray-300 text-center font-medium">Start a conversation with your local AI agent...</p>
                                <p className="text-xs text-gray-500 text-center mt-2">(Model: {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name})</p>
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
                        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-start">
                                <div className="bg-slate-900/60 rounded-2xl rounded-bl-sm px-5 py-3 border-2 border-blue-500/20 backdrop-blur-sm flex items-center gap-2 shadow-xl shadow-blue-500/20">
                                    <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce shadow-lg shadow-cyan-400/50" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce shadow-lg shadow-blue-400/50" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce shadow-lg shadow-pink-400/50" style={{ animationDelay: '300ms' }} />
                                    <span className="text-xs text-blue-300 ml-2 font-medium animate-pulse">Thinking...</span>
                                </div>
                            </div>

                            {downloadProgress && downloadProgress.status === 'progress' && (
                                <div className="w-full max-w-md bg-slate-900/80 rounded-xl p-4 border border-blue-500/30 backdrop-blur-md shadow-2xl ml-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Downloading Model</span>
                                        <span className="text-xs font-bold text-white">{Math.round(downloadProgress.progress || 0)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                            style={{ width: `${downloadProgress.progress || 0}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                                        <span className="truncate max-w-[200px]">{downloadProgress.file}</span>
                                        <span>{downloadProgress.loaded && downloadProgress.total ? `${(downloadProgress.loaded / 1024 / 1024).toFixed(1)}MB / ${(downloadProgress.total / 1024 / 1024).toFixed(1)}MB` : ''}</span>
                                    </div>
                                </div>
                            )}
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
