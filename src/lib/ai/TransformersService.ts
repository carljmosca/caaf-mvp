
import { AutoTokenizer, AutoModelForCausalLM, TextStreamer, InterruptableStoppingCriteria } from '@huggingface/transformers';


export class TransformersService {
    private modelId: string = 'onnx-community/granite-4.0-micro-ONNX-web';
    private tokenizer: any = null;
    private model: any = null;
    private isLoading: boolean = false;
    private stoppingCriteria = new InterruptableStoppingCriteria();
    private pastKeyValuesCache: any = null;


    constructor() {
        // Singleton pattern, nothing needed here
    }


    async setModel(modelId: string) {
        if (this.modelId === modelId && this.model) return;

        this.modelId = modelId;
        this.tokenizer = null;
        this.model = null;
        this.pastKeyValuesCache = null;
        // We don't auto-initialize here, it will happen on next generate or explicit initialize call
    }

    getModelId() {
        return this.modelId;
    }

    async initialize(progressCallback?: (progress: any) => void) {
        if (this.tokenizer && this.model) return;
        if (this.isLoading) return;
        this.isLoading = true;
        try {
            console.log(`Loading model and tokenizer: ${this.modelId}...`);
            this.tokenizer = await AutoTokenizer.from_pretrained(this.modelId, {
                progress_callback: progressCallback,
            });
            this.model = await AutoModelForCausalLM.from_pretrained(this.modelId, {
                dtype: 'q4f16',
                device: 'webgpu',
                progress_callback: progressCallback,
            });
            // Warm up model (compile shaders)
            const inputs = this.tokenizer('a');
            await this.model.generate({ ...inputs, max_new_tokens: 1 });
            console.log('Model and tokenizer loaded and warmed up.');
        } catch (error) {
            console.error('Failed to load model or tokenizer:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }


    async generate(messages: any[], onProgress?: (progress: any) => void): Promise<string> {
        await this.initialize(onProgress);
        const tokenizer = this.tokenizer;
        const model = this.model;
        if (!tokenizer || !model) {
            throw new Error('Model or tokenizer not loaded');
        }

        // Prepare chat template input
        const inputs = tokenizer.apply_chat_template(messages, {
            add_generation_prompt: true,
            return_dict: true,
        });

        let startTime: number | undefined;
        let numTokens = 0;
        let tps: number | undefined;
        const token_callback_function = () => {
            startTime ??= performance.now();
            if (numTokens++ > 0) {
                tps = (numTokens / (performance.now() - startTime)) * 1000;
            }
        };
        // Optionally, you can implement a callback for streaming output
        const streamer = new TextStreamer(tokenizer, {
            skip_prompt: true,
            skip_special_tokens: true,
            callback_function: (output: string) => {
                if (onProgress) onProgress({ output, tps, numTokens });
            },
            token_callback_function,
        });

        try {
            const { past_key_values, sequences } = await model.generate({
                ...inputs,
                past_key_values: this.pastKeyValuesCache,
                max_new_tokens: 1024,
                streamer,
                stopping_criteria: this.stoppingCriteria,
                return_dict_in_generate: true,
            });
            this.pastKeyValuesCache = past_key_values;
            const decoded = tokenizer.batch_decode(sequences, {
                skip_special_tokens: true,
            });
            return Array.isArray(decoded) ? decoded.join('\n') : decoded;
        } catch (error) {
            console.error('Generation error:', error);
            return "Sorry, I encountered an error generating the response locally.";
        }
    }
}
