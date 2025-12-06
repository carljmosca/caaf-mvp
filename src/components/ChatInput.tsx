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

import React, { useRef, useEffect } from 'react';
import { Send, Image, Mic, Plus } from 'lucide-react';

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    onSend: () => void;
    isProcessing: boolean;
    isDisabled: boolean;
    placeholder?: string;
    onMenuClick?: () => void; // New prop for mobile menu trigger inside bar
}

const ChatInputImpl = (
    { input, setInput, onSend, isDisabled, placeholder }: ChatInputProps,
    ref: React.Ref<HTMLTextAreaElement>
) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    // If parent passes a ref, use it; else use local ref
    const combinedRef = (ref ?? textareaRef) as React.RefObject<HTMLTextAreaElement>;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    useEffect(() => {
        if (combinedRef.current) {
            combinedRef.current.style.height = 'auto';
            combinedRef.current.style.height = `${Math.min(combinedRef.current.scrollHeight, 150)}px`;
        }
    }, [input]);

    return (
        <div className="bg-[#131314] px-4 pb-4 pt-2">
            <div className="max-w-4xl mx-auto">
                <div className="relative bg-[#1E1F20] rounded-[28px] transition-colors focus-within:bg-[#2D2E2F] flex items-end p-2 gap-2">

                    {/* Left Action (Visual only for now) */}
                    <button className="p-2 text-[#C4C7C5] hover:text-[#E3E3E3] hover:bg-[#3C3D3E] rounded-full transition-colors hidden md:block">
                        <Plus className="w-5 h-5" />
                    </button>

                    {/* Main Input */}
                    <textarea
                        ref={combinedRef}
                        autoFocus
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isDisabled}
                        placeholder={placeholder || "Enter a prompt here"}
                        rows={1}
                        className="
              flex-1 bg-transparent text-[#E3E3E3] placeholder-[#C4C7C5]
              px-2 py-3 min-h-[48px] max-h-[150px]
              focus:outline-none resize-none
              disabled:opacity-50 text-base
            "
                    />

                    {/* Right Actions */}
                    <div className="flex items-center gap-1 pb-1">
                        {/* Fake Mic/Image icons for visual parity */}
                        {!input.trim() && (
                            <>
                                <button className="p-2 text-[#C4C7C5] hover:text-[#E3E3E3] hover:bg-[#3C3D3E] rounded-full transition-colors">
                                    <Image className="w-5 h-5" />
                                </button>
                                <button className="p-2 text-[#C4C7C5] hover:text-[#E3E3E3] hover:bg-[#3C3D3E] rounded-full transition-colors">
                                    <Mic className="w-5 h-5" />
                                </button>
                            </>
                        )}

                        {input.trim() && (
                            <button
                                onClick={onSend}
                                disabled={isDisabled}
                                className="p-2 text-[#A8C7FA] hover:text-white hover:bg-[#3C3D3E] rounded-full transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-2 text-center text-[11px] text-[#C4C7C5]">
                    Local Agent may display inaccurate info, including about people, so double-check its responses.
                </div>
            </div>
        </div>
    );
};

export const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(ChatInputImpl);
