export class GraniteService {
    private apiKey: string;
    private endpoint: string;

    constructor(apiKey: string = "", endpoint: string = "https://example.com/api/v1/generate") {
        this.apiKey = apiKey;
        this.endpoint = endpoint;
    }

    async generate(prompt: string): Promise<string> {
        if (!this.apiKey) {
            console.warn("No API key provided for GraniteService. Using mock response.");
            return this.mockResponse(prompt);
        }

        try {
            const response = await fetch(this.endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model_id: "ibm/granite-3b-chat-v2",
                    inputs: [prompt],
                    parameters: {
                        decoding_method: "greedy",
                        max_new_tokens: 200,
                        min_new_tokens: 0,
                        stop_sequences: [],
                        repetition_penalty: 1.0,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`Granite API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.results[0].generated_text;
        } catch (error) {
            console.error("Error calling Granite API:", error);
            return "Sorry, I encountered an error connecting to the AI model.";
        }
    }

    private mockResponse(prompt: string): string {
        if (prompt.includes("hello") || prompt.includes("hi")) {
            return "Hello! I am the CAAF Agent powered by IBM Granite. How can I help you today?";
        }
        if (prompt.includes("tool")) {
            return "I can use MCP tools to help you. Please connect a tool first.";
        }
        return `I received your message: "${prompt}". I am a mock agent for now.`;
    }
}
