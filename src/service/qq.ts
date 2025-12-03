interface User {
  id: string;
  nickname: string;
}

interface IncomingMessage {
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
    | any
  >;
  raw_message: string;
}

interface ParsedResult {
  group: string;
  sender: User;
  message: string;
  time: Date;
}

/**
 * 解析群消息：是否 @了自己 并且 是纯文本消息
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

  return {
    group: String(data.group_id),
    sender: {
      id: String(data.sender.user_id),
      nickname: data.sender.nickname,
    },
    message: textParts,
    time: new Date(data.time * 1000),
  };
}
