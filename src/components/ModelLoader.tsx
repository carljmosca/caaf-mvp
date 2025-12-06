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
import { Loader2, Download, Cpu } from 'lucide-react';

interface ModelLoaderProps {
    progress: any; // Using any for the raw progress object from transformers
}

export const ModelLoader: React.FC<ModelLoaderProps> = ({ progress }) => {
    const isDownloading = progress && progress.status === 'progress';
    const percent = isDownloading ? Math.round(progress.progress || 0) : 0;

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8 text-center">

                {/* Icon Animation */}
                <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
                    <div className="relative h-full w-full bg-slate-900 border-2 border-indigo-500/30 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Cpu className="w-10 h-10 text-indigo-400" />
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-100">Initializing AI Agent</h2>
                    <p className="text-slate-400">Loading model resources and preparing environment...</p>
                </div>

                {/* Progress Bar Area */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            {isDownloading ? (
                                <Download className="w-4 h-4 text-indigo-400 animate-bounce" />
                            ) : (
                                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                            )}
                            <span className="text-sm font-semibold text-slate-300">
                                {progress ? (progress.file || progress.status) : 'Starting...'}
                            </span>
                        </div>
                        {isDownloading && (
                            <span className="text-sm font-mono text-indigo-400">{percent}%</span>
                        )}
                    </div>

                    {/* Bar */}
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        {isDownloading ? (
                            <div
                                className="h-full bg-indigo-500 transition-all duration-200 ease-out"
                                style={{ width: `${percent}%` }}
                            />
                        ) : (
                            <div className="h-full bg-indigo-500/50 w-full animate-pulse" />
                        )}
                    </div>

                    {/* Stats */}
                    {isDownloading && progress.loaded && progress.total && (
                        <div className="flex justify-between mt-2 text-xs text-slate-500 font-mono">
                            <span>{progress.name || 'Model file'}</span>
                            <span>
                                {(progress.loaded / 1024 / 1024).toFixed(1)} / {(progress.total / 1024 / 1024).toFixed(1)} MB
                            </span>
                        </div>
                    )}
                </div>

                <p className="text-xs text-slate-600">
                    This runs locally in your browser. First load may take a moment.
                </p>

            </div>
        </div>
    );
};
