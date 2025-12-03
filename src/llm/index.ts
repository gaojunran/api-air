import OpenAI from "npm:openai";
import { assert, requireEnv, throwIfNil } from "../utils/index.ts";

const CONFIG = {
  fixedPrompt: `你是一个 QQ 群机器人。你的职责是以简短的语言回复提问。
  你应该用 100 字以内（中位数 50 字）来回答问题，避免冗长的解释。除非用户明确了「详细」等关键词，否则请保持简洁。
  你应该尽量用段落和列表来组织内容，避免使用标题（h1, h2 等）。
  你通常应该使用中文回答问题，除非用户明确要求使用其他语言。
  `,
  systemPrompt: "",
  models: {
    default: "deepseek-ai/DeepSeek-V3.2-Exp",
    fast: "THUDM/GLM-4-9B-0414",
  },
};

// 禁止修改 fixedPrompt
Object.defineProperty(CONFIG, "fixedPrompt", {
  writable: false,
  configurable: false,
});

function modifySystemPrompt(newPrompt: string) {
  assert(
    newPrompt.length > 100,
    "System prompt too long, must be less than 100 characters",
  );
  CONFIG.systemPrompt = newPrompt;
}

async function simpleAnswer(
  question: string,
  useModel: keyof typeof CONFIG.models = "default",
): Promise<string> {
  const client = new OpenAI({
    apiKey: requireEnv("OPENAI_API_KEY"),
    baseURL: "https://api.siliconflow.cn/v1",
  });

  const response = await client.responses.create({
    model: useModel,
    input: [
      { role: "system", content: CONFIG.fixedPrompt + CONFIG.systemPrompt },
      { role: "user", content: question },
    ],
  });

  console.log(response.output_text);

  return response.output_text;
}
