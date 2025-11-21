import React from 'react';
import { Wrench, Sparkles } from 'lucide-react';
import type { Tool } from '../lib/mcp/McpToolRegistry';

interface ToolStatusProps {
    tools: Tool[];
}

export const ToolStatus: React.FC<ToolStatusProps> = ({ tools }) => {
    return (
        <div className="p-6 h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 rounded-lg shadow-xl shadow-blue-500/50">
                    <Wrench className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="font-bold text-lg text-white">MCP Tools</h2>
                    <p className="text-xs text-gray-400">{tools.length} available</p>
                </div>
            </div>

            {tools.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Sparkles className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm italic">No tools discovered</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tools.map((tool, idx) => (
                        <div
                            key={idx}
                            className="group relative bg-gradient-to-br from-slate-900/60 to-purple-900/20 backdrop-blur-sm border-2 border-blue-500/20 rounded-xl p-4 hover:border-blue-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 cursor-pointer"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-600/20 to-blue-500/20 rounded-lg group-hover:from-blue-600/30 group-hover:to-blue-500/30 transition-all shadow-lg shadow-blue-500/20">
                                    <Sparkles className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-white mb-1 flex items-center gap-2">
                                        {tool.name}
                                        <span className="px-2 py-0.5 bg-gradient-to-r from-blue-600/30 to-blue-500/30 text-blue-300 text-xs rounded-full border border-blue-400/30 shadow-lg shadow-blue-600/20">
                                            MCP
                                        </span>
                                    </div>
                                    {tool.description && (
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            {tool.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {/* Vibrant gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-500/10 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
