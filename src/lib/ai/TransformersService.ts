import { pipeline, TextGenerationPipeline } from '@huggingface/transformers';

export class TransformersService {
    private generator: TextGenerationPipeline | null = null;
    private modelId: string = 'onnx-community/granite-4.0-350m-ONNX-web';
    private isLoading: boolean = false;

    constructor() {
        // Lazy load in generate if not already loading
    }

    async initialize(progressCallback?: (progress: any) => void) {
        if (this.generator) return;
        if (this.isLoading) return;

        this.isLoading = true;
        try {
            console.log(`Loading model: ${this.modelId}...`);
            // @ts-ignore - Types might be slightly off for v3 currently
            this.generator = await pipeline('text-generation', this.modelId, {
                progress_callback: (progress: any) => {
                    if (progressCallback) progressCallback(progress);
                },
                dtype: 'q4', // Explicitly request q4 quantization
            });
            console.log('Model loaded successfully.');
        } catch (error) {
            console.error('Failed to load model:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    async generate(prompt: string, onProgress?: (progress: any) => void): Promise<string> {
        if (!this.generator) {
            await this.initialize(onProgress);
        }

        if (!this.generator) {
            throw new Error('Model failed to initialize');
        }

        try {
            console.log('Generating response for:', prompt);
            const result = await this.generator(prompt, {
                max_new_tokens: 200,
                temperature: 0.7,
                do_sample: true,
                return_full_text: false,
            });

            // @ts-ignore
            const generatedText = result[0].generated_text;
            return generatedText;
        } catch (error) {
            console.error('Generation error:', error);
            return "Sorry, I encountered an error generating the response locally.";
        }
    }
}
