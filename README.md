# CAAF MVP (Client-Side AI Agent Framework)

A modern, browser-based AI agent framework built with React, TypeScript, and Transformers.js. This application runs AI inference directly in the browser and connects to Model Context Protocol (MCP) servers to extend capabilities with tools.

## 🚀 Features

- **In-Browser Inference**: Runs the `onnx-community/granite-4.0-350m-ONNX-web` model locally in your browser using [Transformers.js](https://huggingface.co/docs/transformers.js). No external API keys or local LLM runners (like Ollama/LM Studio) required for the chat model.
- **MCP Integration**: Connects to [Model Context Protocol](https://modelcontextprotocol.io/) servers to discover and execute tools.
- **Auto-Connect**: Automatically connects to the local MCP server on startup.
- **Modern UI**:
  - Vibrant, glassmorphism-inspired design.
  - Real-time progress bars for model downloading.
  - "Thinking..." indicators for AI processing.
  - Persistent sidebar with "New Chat" functionality.
- **Smart Tool Execution**: Parses tool responses to extract and display relevant results cleanly.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **AI/ML**: `@huggingface/transformers` (Transformers.js)
- **Protocol**: `@modelcontextprotocol/sdk`

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd caaf-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## 🏃‍♂️ Running the Application

1. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

2. **(Optional) Run an MCP Server**
   To use tools, you need an MCP server running locally. By default, the application attempts to connect to `http://localhost:3000/mcp`.
   
   Ensure your MCP server is running and accessible at that URL.

## 💡 Usage

1. **Initial Load**: On the first visit, the application will download the quantized Granite model (~350MB). A progress bar will show the download status.
2. **Chatting**: Type your message in the input box. The AI will respond using the local model.
3. **Using Tools**: If connected to an MCP server, the AI can decide to call tools based on your prompt. The tool execution results will be displayed in the chat.
4. **New Chat**: Click the "New Chat" button in the sidebar to reset the conversation context.

## 🔧 Configuration

- **MCP Server URL**: You can configure the MCP server URL and transport type (HTTP/WebSocket) in the top right corner if the auto-connection fails or if you need to switch servers.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
