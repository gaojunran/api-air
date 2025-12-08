import { simpleAnswer } from "./llm.ts";

interface User {
  id: string;
  nickname: string;
}

// Instruction response type
export interface InstructionResponse {
  ats: string[];
  text: string;
}

// Parsed result interface (moved before Instruction for reference)
export interface ParsedResult {
  group: string;
  sender: User;
  message: string;
  time: Date;
  replyContent?: string;
  instruction?: Instruction;
}

// Instruction type definition
export interface Instruction {
  key: string;
  aliases: string[];
  action: (parsed: ParsedResult) => Promise<InstructionResponse>;
}

/**
 * Format date to yyyy-mm-dd in UTC+8
 */
function formatDateUTC8(date: Date): string {
  const utc8Date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const year = utc8Date.getUTCFullYear();
  const month = String(utc8Date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utc8Date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Instruction table
export const INSTRUCTIONS: Record<string, Instruction> = {
  prompt: {
    key: "prompt",
    aliases: ["/prompt", "/提示词"],
    action: async (_parsed) => {
      // TODO: implement prompt action
      return { ats: [], text: "提示词指令功能开发中..." };
    },
  },
  remind: {
    key: "remind",
    aliases: ["/remind", "/提醒"],
    action: async (_parsed) => {
      // TODO: implement remind action
      return { ats: [], text: "提醒指令功能开发中..." };
    },
  },
  absent: {
    key: "absent",
    aliases: ["/absent", "/请假"],
    action: async (parsed) => {
      const todayStr = formatDateUTC8(new Date());
      const fixedPrompt = `今天的日期是${todayStr}。你的任务是将以下自然语言描述的请假信息生成 JSON 表示。注意，你的生成内容必须以 JSON 的大括号开始和结尾，不能包含无用的记号（如 \`\`\` 等）

JSON 的模式为：

date_format：字符串，以 yyyy-mm-dd 格式化的日期，为请假日期，你应该根据今天的日期来推算。

class_seq_number：当天的第几节课。你应该根据用户的语言推算。有效值为 1, 3, 5, 7, 9。如果用户说我明天七八节请假，那应该提供开始的节次 7。

你必须保证字段名 date_format 和 class_seq_number 不出错，并给出合法的值。`;

      try {
        console.log(`Processing absence request: ${parsed.message}`);

        // Call LLM with fast model
        const llmResponse = await simpleAnswer(
          parsed.message,
          fixedPrompt,
          undefined,
          "fast",
        );

        console.log(llmResponse);

        // Parse JSON response
        let jsonData: { date_format: string; class_seq_number: number };
        try {
          // Remove markdown code block markers if present
          const cleanedResponse = llmResponse
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
          jsonData = JSON.parse(cleanedResponse);
          // Validate required fields
          if (!jsonData.date_format || !jsonData.class_seq_number) {
            throw new Error("Missing required fields");
          }
          if (![1, 3, 5, 7, 9].includes(jsonData.class_seq_number)) {
            throw new Error("Invalid class_seq_number");
          }
        } catch (parseError) {
          return {
            ats: [parsed.sender.id],
            text: `解析请假信息失败，请重新描述。例如：/请假 明天七八节`,
          };
        }

        // Send POST request to absence API
        const requestBody = {
          date_format: jsonData.date_format,
          class_seq_number: jsonData.class_seq_number,
          user_qq_account: parsed.sender.id,
          created_at: Date.now(),
        };

        const response = await fetch(
          "https://tronclass.codenebula.deno.net/absence/add/qqbot",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          },
        );

        if (!response.ok) {
          return {
            ats: [parsed.sender.id],
            text: `请假请求失败，服务器返回：${response.status}`,
          };
        }

        const responseJson = await response.json();

        // Convert response to key-value format
        const kvLines = Object.entries(responseJson)
          .map(([key, value]) => `${key}：${value}`)
          .join("\n");

        return {
          ats: [parsed.sender.id],
          text: `明白了！如下课程你不会被自动签到：\n${kvLines}`,
        };
      } catch (error) {
        return {
          ats: [parsed.sender.id],
          text: `请假处理出错：${error instanceof Error ? error.message : "未知错误"}`,
        };
      }
    },
  },
};

// Build alias to instruction map for quick lookup
const aliasToInstruction: Map<string, Instruction> = new Map();
for (const instruction of Object.values(INSTRUCTIONS)) {
  for (const alias of instruction.aliases) {
    aliasToInstruction.set(alias, instruction);
  }
}

/**
 * Parse instruction from text that starts with /
 */
export function parseInstruction(text: string): Instruction | undefined {
  if (!text.startsWith("/")) return undefined;

  // Extract the command part (first word)
  const commandMatch = text.match(/^(\/\S+)/);
  if (!commandMatch) return undefined;

  const command = commandMatch[1];
  return aliasToInstruction.get(command);
}

export interface IncomingMessage {
  self_id: number;
  message_type: string;
  group_id: number;
  time: number;
  sender: {
    user_id: number;
    nickname: string;
  };
  message: Array<
    | { type: "at"; data: { qq: string } }
    | { type: "text"; data: { text: string } }
    | { type: "reply"; data: { id: string } }
    | any
  >;
  raw_message: string;
  raw?: {
    elements?: Array<{
      elementType: number;
      replyElement?: {
        sourceMsgTextElems?: Array<{
          replyAbsElemType: number;
          textElemContent?: string;
        }>;
      };
    }>;
  };
}

/**
 * 解析群消息：是否 @了自己 并且 是纯文本消息
 * 支持回复消息的解析
 */
export function parseAtTextMessage(
  data: IncomingMessage,
): ParsedResult | undefined {
  // 必须是群消息
  if (data.message_type !== "group") return undefined;

  const selfId = String(data.self_id);

  // 查找是否 @ 自己
  const hasAtMe = data.message.some(
    (m) => m.type === "at" && m.data?.qq === selfId,
  );
  if (!hasAtMe) return undefined;

  // 提取所有文本消息片段
  const textParts = data.message
    .filter((m) => m.type === "text")
    .map((m) => m.data.text)
    .join("")
    .trim();

  if (!textParts) return undefined;

  // Parse instruction if text starts with /
  const instruction = parseInstruction(textParts);

  // 提取回复的消息内容
  let replyContent: string | undefined;

  // 检查是否有 reply 类型的消息
  const hasReply = data.message.some((m) => m.type === "reply");

  if (hasReply && data.raw?.elements) {
    // 从 raw.elements 中查找 replyElement
    for (const element of data.raw.elements) {
      if (element.elementType === 7 && element.replyElement) {
        const sourceMsgTextElems = element.replyElement.sourceMsgTextElems;
        if (sourceMsgTextElems && sourceMsgTextElems.length > 0) {
          // 拼接所有文本内容
          replyContent = sourceMsgTextElems
            .filter((elem) =>
              elem.replyAbsElemType === 1 && elem.textElemContent
            )
            .map((elem) => elem.textElemContent)
            .join("");
          break;
        }
      }
    }
  }

  return {
    group: String(data.group_id),
    sender: {
      id: String(data.sender.user_id),
      nickname: data.sender.nickname,
    },
    message: textParts,
    time: new Date(data.time * 1000),
    replyContent,
    instruction,
  };
}
