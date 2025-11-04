export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextWindow: string;
  parameters: string;
  inputCost: string;
  outputCost: string;
  specialFeatures?: string[];
}

export const AI_MODELS: AIModel[] = [
  {
    id: "nvidia/nemotron-nano-12b-v2-vl:free",
    name: "Nemotron Nano 12B V2 VL",
    provider: "NVIDIA",
    description: "NVIDIA's vision-language model optimized for multimodal understanding. Excellent for analyzing resumes with visual elements.",
    contextWindow: "32K",
    parameters: "12B parameters",
    inputCost: "$0/M",
    outputCost: "$0/M",
    specialFeatures: ["Vision-Language", "Multimodal", "Fast", "Efficient"]
  },
  {
    id: "mistralai/mistral-small-3.2-24b-instruct:free",
    name: "Mistral Small 3.2 24B Instruct",
    provider: "Mistral",
    description: "Latest Mistral model with 24B parameters. Advanced multimodal capabilities with excellent instruction following for professional analysis.",
    contextWindow: "128K",
    parameters: "24B parameters",
    inputCost: "$0/M",
    outputCost: "$0/M",
    specialFeatures: ["Multimodal", "Large Context", "Instruction Following", "Latest"]
  },
  {
    id: "meta-llama/llama-4-maverick:free",
    name: "Llama 4 Maverick",
    provider: "Meta",
    description: "Meta's latest Llama 4 model with advanced reasoning and multimodal capabilities. Optimized for complex analysis tasks.",
    contextWindow: "128K",
    parameters: "17B active (400B total)",
    inputCost: "$0/M",
    outputCost: "$0/M",
    specialFeatures: ["Llama 4", "Multimodal", "Advanced Reasoning", "Latest Generation"]
  },
  {
    id: "meta-llama/llama-4-scout:free",
    name: "Llama 4 Scout",
    provider: "Meta",
    description: "Llama 4 Scout with mixture-of-experts architecture. Efficient and powerful for detailed resume evaluation.",
    contextWindow: "128K",
    parameters: "17B active (109B total)",
    inputCost: "$0/M",
    outputCost: "$0/M",
    specialFeatures: ["Llama 4", "MoE Architecture", "Efficient", "Multimodal"]
  },
  {
    id: "qwen/qwen2.5-vl-32b-instruct:free",
    name: "Qwen 2.5 VL 32B Instruct",
    provider: "Qwen",
    description: "Advanced vision-language model with 32B parameters. Excellent for comprehensive document analysis and visual understanding.",
    contextWindow: "32K",
    parameters: "32B parameters",
    inputCost: "$0/M",
    outputCost: "$0/M",
    specialFeatures: ["Vision-Language", "Large Model", "Document Analysis", "Multimodal"]
  },
  {
    id: "mistralai/mistral-small-3.1-24b-instruct:free",
    name: "Mistral Small 3.1 24B Instruct",
    provider: "Mistral",
    description: "Mistral 3.1 with 24B parameters. Strong performance in text reasoning and professional document analysis.",
    contextWindow: "128K",
    parameters: "24B parameters",
    inputCost: "$0/M",
    outputCost: "$0/M",
    specialFeatures: ["Large Context", "Reasoning", "Instruction Following", "Professional"]
  },
  {
    id: "google/gemma-3-4b-it:free",
    name: "Gemma 3 4B IT",
    provider: "Google",
    description: "Google's Gemma 3 instruction-tuned model. Compact yet powerful for resume analysis with multimodal support.",
    contextWindow: "128K",
    parameters: "4B parameters",
    inputCost: "$0/M",
    outputCost: "$0/M",
    specialFeatures: ["Gemma 3", "Multimodal", "Fast", "Efficient"]
  },
  {
    id: "google/gemma-3-12b-it:free",
    name: "Gemma 3 12B IT",
    provider: "Google",
    description: "Mid-size Gemma 3 model with enhanced capabilities. Great balance of performance and quality for detailed analysis.",
    contextWindow: "128K",
    parameters: "12B parameters",
    inputCost: "$0/M",
    outputCost: "$0/M",
    specialFeatures: ["Gemma 3", "Multimodal", "Balanced", "Quality"]
  },
  {
    id: "google/gemma-3-27b-it:free",
    name: "Gemma 3 27B IT",
    provider: "Google",
    description: "Largest Gemma 3 model with superior performance. Best for comprehensive and detailed resume evaluation.",
    contextWindow: "128K",
    parameters: "27B parameters",
    inputCost: "$0/M",
    outputCost: "$0/M",
    specialFeatures: ["Gemma 3", "Large Model", "Multimodal", "High Quality"]
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash Experimental",
    provider: "Google",
    description: "Google's latest Gemini 2.0 Flash with experimental features. Ultra-fast with massive context window for complex analysis.",
    contextWindow: "1M",
    parameters: "Large-scale",
    inputCost: "$0/M",
    outputCost: "$0/M",
    specialFeatures: ["Gemini 2.0", "Ultra-Fast", "1M Context", "Experimental", "Latest"]
  }
];

export const DEFAULT_MODEL = AI_MODELS[0];
