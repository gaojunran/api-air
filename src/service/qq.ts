interface User {
  id: string;
  nickname: string;
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

interface ParsedResult {
  group: string;
  sender: User;
  message: string;
  time: Date;
  replyContent?: string;
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
  };
}
