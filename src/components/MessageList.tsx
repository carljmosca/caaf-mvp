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

import React, { useEffect, useRef } from 'react';
import { Download, Bot } from 'lucide-react';
import { ChatMessage, type Message } from './ChatMessage';

interface DownloadProgress {
    status: string;
    file?: string;
    progress?: number;
    loaded?: number;
    total?: number;
}

interface MessageListProps {
    messages: Message[];
    isProcessing: boolean;
    downloadProgress: DownloadProgress | null;
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    isProcessing,
    downloadProgress
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isProcessing, downloadProgress]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                    <Bot className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-4xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2">
                    Hello, Carl
                </h2>
                <h3 className="text-4xl font-normal text-[#444746] mb-8">
                    How can I help today?
                </h3>

                {/* Quick Prompts (Visual only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                    <div className="bg-[#1E1F20] hover:bg-[#2D2E2F] p-4 rounded-xl text-left cursor-pointer transition-colors border border-transparent hover:border-[#444746]">
                        <p className="text-[#E3E3E3] text-sm">Summarize this text</p>
                    </div>
                    <div className="bg-[#1E1F20] hover:bg-[#2D2E2F] p-4 rounded-xl text-left cursor-pointer transition-colors border border-transparent hover:border-[#444746]">
                        <p className="text-[#E3E3E3] text-sm">Help me write a story</p>
                    </div>
                    <div className="bg-[#1E1F20] hover:bg-[#2D2E2F] p-4 rounded-xl text-left cursor-pointer transition-colors border border-transparent hover:border-[#444746]">
                        <p className="text-[#E3E3E3] text-sm">Planning a trip</p>
                    </div>
                    <div className="bg-[#1E1F20] hover:bg-[#2D2E2F] p-4 rounded-xl text-left cursor-pointer transition-colors border border-transparent hover:border-[#444746]">
                        <p className="text-[#E3E3E3] text-sm">Code a React app</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scroll-smooth">
            {messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} />
            ))}

            {/* Loading / Typing State */}
            {isProcessing && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-start">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white animate-pulse" />
                            </div>
                            <span className="text-sm font-medium text-[#C4C7C5] animate-pulse">Thinking...</span>
                        </div>
                    </div>

                    {/* Download Progress Card */}
                    {downloadProgress && downloadProgress.status === 'progress' && (
                        <div className="ml-10 max-w-sm w-full bg-[#1E1F20] border border-[#444746] rounded-xl p-4 shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Download className="w-4 h-4 text-[#A8C7FA]" />
                                    <span className="text-xs font-semibold text-[#E3E3E3]">Downloading Model</span>
                                </div>
                                <span className="text-xs font-mono text-[#A8C7FA]">{Math.round(downloadProgress.progress || 0)}%</span>
                            </div>

                            <div className="h-1 bg-[#2D2E2F] rounded-full overflow-hidden mb-2">
                                <div
                                    className="h-full bg-[#A8C7FA] transition-all duration-300 ease-out"
                                    style={{ width: `${downloadProgress.progress || 0}%` }}
                                />
                            </div>

                            <div className="flex justify-between text-[10px] text-[#C4C7C5] font-mono">
                                <span className="truncate max-w-[150px]">{downloadProgress.file}</span>
                                <span>
                                    {downloadProgress.loaded && downloadProgress.total
                                        ? `${(downloadProgress.loaded / 1024 / 1024).toFixed(1)} / ${(downloadProgress.total / 1024 / 1024).toFixed(1)} MB`
                                        : ''}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    );
};
