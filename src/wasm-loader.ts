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

// src/wasm-loader.ts
// This script loads and runs main.wasm using Go's wasm_exec.js runtime.

declare class Go {
    importObject: any;
    run(instance: WebAssembly.Instance): Promise<void>;
}

(async () => {
    if (typeof Go !== 'function') {
        console.error('Go WASM runtime not found. Ensure wasm_exec.js is loaded first.');
        return;
    }

    const go = new Go();
    try {
        // Vite will replace import.meta.env.BASE_URL
        const base = import.meta.env.BASE_URL;
        // content of public/ is served at root of base
        // ensuring we don't double slash if base ends with /
        const url = base.endsWith('/') ? base + 'main.wasm' : base + '/main.wasm';

        console.log(`Loading WASM from: ${url}`); // Debug log

        const wasmResponse = await fetch(url);
        if (!wasmResponse.ok) throw new Error(`Failed to fetch main.wasm: ${wasmResponse.statusText}`);

        const wasmBytes = await wasmResponse.arrayBuffer();
        const { instance } = await WebAssembly.instantiate(wasmBytes, go.importObject);
        await go.run(instance);

        if (typeof (window as any).mcpHandleRequest !== 'function') {
            console.error('mcpHandleRequest was not registered by the WASM MCP server.');
        } else {
            console.log('WASM MCP server loaded and mcpHandleRequest registered.');
        }
    } catch (err) {
        console.error('Failed to load or run main.wasm:', err);
    }
})();
