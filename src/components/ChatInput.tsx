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

export const ChatInput: React.FC<ChatInputProps> = ({
    input,
    setInput,
    onSend,
    isDisabled,
    placeholder
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
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
                        ref={textareaRef}
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
