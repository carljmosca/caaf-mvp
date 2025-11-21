export class GraniteService {
    private apiKey: string;
    private endpoint: string;

    constructor(apiKey: string = "", endpoint: string = "https://example.com/api/v1/generate") {
        this.apiKey = apiKey;
        this.endpoint = endpoint;
    }

    async generate(prompt: string): Promise<string> {
        // LM Studio local server usually doesn't strictly require an API key, 
        // but we'll keep the check if one is provided, or default to a dummy one if needed.
        // For local dev, we can just proceed.

        try {
            const response = await fetch(this.endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey || "lm-studio"}`,
                },
                body: JSON.stringify({
                    model: "ibm/granite-3.2-8b",
                    messages: [
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                    stream: false
                }),
            });

            if (!response.ok) {
                throw new Error(`Granite API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error: any) {
            console.error("Error calling Granite API:", error);
            if (error instanceof TypeError && error.message === "Failed to fetch") {
                console.error("Network error: Check if LM Studio is running and CORS is enabled.");
            }
            // Fallback to mock if connection fails (e.g. LM Studio not running)
            console.warn("Falling back to mock response due to error.");
            return this.mockResponse(prompt);
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
