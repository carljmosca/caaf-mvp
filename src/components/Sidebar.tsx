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
import { Plus, MessageSquare, Settings } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onNewChat: () => void;
    onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    onNewChat,
    onOpenSettings
}) => {
    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            <aside className={`
        fixed inset-y-0 left-0 z-50 w-[280px] bg-[#1E1F20] text-[#E3E3E3] flex flex-col
        transform transition-transform duration-300 cubic-bezier(0.2, 0.0, 0, 1.0)
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Top Section */}
                <div className="p-4">
                    <button
                        onClick={onNewChat}
                        className="w-full flex items-center gap-3 bg-[#2D2E2F] hover:bg-[#3C3D3E] text-[#E3E3E3] px-4 py-3 rounded-full transition-colors font-medium text-sm border border-transparent hover:border-[#444746]"
                    >
                        <Plus className="w-5 h-5 text-[#A8C7FA]" />
                        <span>New chat</span>
                    </button>
                </div>

                {/* Recent Section */}
                <div className="flex-1 overflow-y-auto px-4 py-2">
                    <div className="text-xs font-medium text-[#C4C7C5] mb-3 px-2 uppercase tracking-wide">Recent</div>
                    <div className="space-y-1">
                        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#E3E3E3] hover:bg-[#2D2E2F] rounded-full transition-colors truncate group">
                            <MessageSquare className="w-4 h-4 text-[#C4C7C5] group-hover:text-[#E3E3E3]" />
                            <span className="truncate">New conversation...</span>
                        </button>
                    </div>
                </div>

                {/* Bottom Section - Settings Button only */}
                <div className="p-4 mt-auto border-t border-[#444746]">
                    <button
                        onClick={onOpenSettings}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#E3E3E3] hover:bg-[#2D2E2F] rounded-full transition-colors"
                    >
                        <Settings className="w-5 h-5 text-[#C4C7C5]" />
                        <span>Settings</span>
                    </button>
                </div>
            </aside>
        </>
    );
};
