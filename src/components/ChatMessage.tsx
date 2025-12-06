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
import { User, Sparkles } from 'lucide-react';

export type MessageRole = 'user' | 'agent';

export interface Message {
    role: MessageRole;
    content: string;
    timing?: string;
}

interface ChatMessageProps {
    message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
            <div className={`flex max-w-[90%] md:max-w-[75%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar */}
                <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1
          ${isUser ? 'bg-[#2D2E2F] text-[#E3E3E3]' : 'bg-transparent'}
        `}>
                    {isUser ? <User className="w-5 h-5" /> : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                    )}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`
            px-5 py-3.5 rounded-[20px] text-[15px] leading-relaxed
            ${isUser
                            ? 'bg-[#2D2E2F] text-[#E3E3E3] rounded-tr-md' // User: Dark Grey Pill
                            : 'bg-transparent text-[#E3E3E3] px-0 py-0 pt-1' // Agent: Plain text
                        }
          `}>
                        <p className="whitespace-pre-wrap font-normal">
                            {message.content}
                        </p>
                    </div>
                    {/* Metadata/Timing */}
                    {message.timing && !isUser && (
                        <div className="flex items-center gap-2 mt-2">
                            <p className="text-[11px] text-[#C4C7C5] px-1 bg-[#1E1F20] rounded-md py-0.5 border border-[#444746] inline-block">
                                {message.timing}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
