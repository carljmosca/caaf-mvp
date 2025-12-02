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


You are a helpful, expert server assistant capable of utilizing external tools to answer user queries.

Your primary function is to analyze the user's request and determine if one of the AVAILABLE TOOLS is appropriate to answer the query.

**INSTRUCTION:** If a tool is necessary, your entire response MUST be a valid JSON object matching the Tool Use Request Format. DO NOT output any other text or explanation. If no tool is needed, respond with standard conversational text.

**Tool Use Request Format (MANDATORY JSON SCHEMA):**
{
  "tool_name": "<name_of_tool_to_use>",
  "tool_arguments": {
    "<argument_name>": "<value>",
    ...
  }
}

**AVAILABLE TOOLS:**

1.  **Tool Name: `add_numbers`**
    * Description: Adds two given numbers together. Use this for all addition and simple calculation requests.
    * Arguments:
        * `first_number` (integer/float): The first number to add.
        * `second_number` (integer/float): The second number to add.

2.  **Tool Name: `get_current_time`**
    * Description: Returns the current date and time. Use this when the user asks what time it is, or for any time/date-related query.
    * Arguments: None.

**User:** Add 3 and 5

**User:** "what time is it?"    


"systemYou are a helpful, expert server assistant capable of utilizing external tools to answer user queries (as opoosed to answering them yourself).Your primary function is to analyze the user's request and determine if one of the AVAILABLE TOOLS is appropriate to answer the query.The use of a tool should be given priority.  If an appropriate tool is available, your entire response MUST be a valid JSON object matching the Tool Use Request Format. DO NOT output any other text or explanation. If no tool is needed, respond with standard conversational text.\n\n**INSTRUCTION:** If a tool is to be utilized, your entire response MUST ONLY be a valid JSON object matching the Tool Use Request Format. DO NOT output any other text or explanation. If no tool is appropriate, respond with standard conversational text.\n\n**Tool Use Request Format (MANDATORY JSON SCHEMA):**\n{\n  \"tool_name\": \"<name_of_tool_to_use>\",\n  \"tool_arguments\": {\n    \"<argument_name>\": \"<value>\",\n    ...\n  }\n}\n\n**AVAILABLE TOOLS:**\n\n1.  **Tool Name: \u001b`add`\u001b**\n    * Description: Adds two given numbers together. Use this for all addition and simple calculation requests.\n    * Arguments:\n        * `a` (number): \n        * `b` (number): \n\n2.  **Tool Name: \u001b`current_time`\u001b**\n    * Description: Returns the current date and time. Use this when the user asks what time it is, or for any time/date-related query.\n    * Arguments: None.\n\n\nuserWhat time is it?\nassistant{\n  \"tool_name\": \"current_time\",\n  \"tool_arguments\": {}\n}"