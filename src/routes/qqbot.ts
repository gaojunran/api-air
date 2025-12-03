import { Hono } from "hono";
import { IncomingMessage, parseAtTextMessage } from "../service/qq.ts";
import { sendGroupMessage } from "../service/qqGroupMessage.ts";
import { simpleAnswer } from "../service/llm.ts";

const qqbot = new Hono();

qqbot.post("/", async (c) => {
  const body = c.get("jsonBody" as never);
  console.log(JSON.stringify(body, null, 2));
  const result = parseAtTextMessage(body as IncomingMessage);
  if (!result) return c.json({ message: "skipped" });
  let answer: string;
  if (result.replyContent) {
    answer = await simpleAnswer(
      result.message + `\n「引用内容」为：\n` + result.replyContent,
      undefined,
      result.replyContent
        ? "你需要基于给出的「引用内容」进行回答。"
        : undefined,
    );
  } else {
    answer = await simpleAnswer(result.message);
  }

  const res = await sendGroupMessage({
    groupId: result.group,
    ats: [result.sender.id],
    text: answer,
  });

  return c.json({ result: res });
});

export default qqbot;
