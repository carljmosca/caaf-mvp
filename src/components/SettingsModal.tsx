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

import React from 'react';
import { X, Cpu, Check, Server } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedModel: string;
    onModelChange: (modelId: string) => void;
    isProcessing: boolean;
    isConnected: boolean;
    toolsCount: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    selectedModel,
    onModelChange,
    isProcessing,
    isConnected,
    toolsCount
}) => {
    if (!isOpen) return null;

    const models = [
        {
            id: 'onnx-community/granite-4.0-micro-ONNX-web',
            name: 'Granite 4.0 Micro',
            desc: 'Balanced performance (800M)',
        },
        {
            id: 'onnx-community/Llama-3.2-1B-Instruct',
            name: 'Llama 3.2 1B',
            desc: 'High speed generation',
        },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-[#1E1F20] border border-[#444746] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#444746]">
                    <h2 className="text-lg font-medium text-[#E3E3E3]">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-[#C4C7C5] hover:text-[#E3E3E3] hover:bg-[#2D2E2F] rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-6">

                    {/* Model Selection */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-[#A8C7FA] uppercase tracking-wider">AI Model</h3>
                        <div className="space-y-2">
                            {models.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => onModelChange(model.id)}
                                    disabled={isProcessing}
                                    className={`
                    w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all
                    ${selectedModel === model.id
                                            ? 'bg-[#2D2E2F] border-[#A8C7FA] shadow-[0_0_0_1px_#A8C7FA]'
                                            : 'bg-transparent border-[#444746] hover:bg-[#2D2E2F]'
                                        }
                  `}
                                >
                                    <div className={`mt-0.5 ${selectedModel === model.id ? 'text-[#A8C7FA]' : 'text-[#C4C7C5]'}`}>
                                        <Cpu className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-sm font-medium ${selectedModel === model.id ? 'text-[#E3E3E3]' : 'text-[#C4C7C5]'}`}>
                                            {model.name}
                                        </div>
                                        <div className="text-xs text-[#C4C7C5] opacity-80 mt-0.5">
                                            {model.desc}
                                        </div>
                                    </div>
                                    {selectedModel === model.id && (
                                        <Check className="w-5 h-5 text-[#A8C7FA]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="space-y-3 pt-2 border-t border-[#444746]">
                        <h3 className="text-xs font-semibold text-[#A8C7FA] uppercase tracking-wider">System Status</h3>
                        <div className="bg-[#0F0F10] rounded-xl p-3 border border-[#444746]">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <span className="text-sm text-[#E3E3E3]">{isConnected ? 'MCP Server Connected' : 'Disconnected'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#C4C7C5] ml-5">
                                <Server className="w-3 h-3" />
                                <span>{toolsCount} tools available</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
