// main.wasm-loader.js
// This script loads and runs main.wasm using Go's wasm_exec.js runtime and ensures mcpHandleRequest is registered before the app starts.

(async () => {
  if (typeof Go !== 'function') {
    console.error('Go WASM runtime not found. Ensure wasm_exec.js is loaded first.');
    return;
  }
  const go = new Go();
  try {
    const wasmResponse = await fetch('/main.wasm');
    if (!wasmResponse.ok) throw new Error('Failed to fetch main.wasm');
    const wasmBytes = await wasmResponse.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(wasmBytes, go.importObject);
    await go.run(instance);
    if (typeof window.mcpHandleRequest !== 'function') {
      console.error('mcpHandleRequest was not registered by the WASM MCP server.');
    } else {
      console.log('WASM MCP server loaded and mcpHandleRequest registered.');
    }
  } catch (err) {
    console.error('Failed to load or run main.wasm:', err);
  }
})();
