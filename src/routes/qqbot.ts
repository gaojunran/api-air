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

  const answer = await simpleAnswer(result.message);

  const res = await sendGroupMessage({
    groupId: result.group,
    ats: [result.sender.id],
    text: answer,
  });

  return c.json({ result: res });
});

export default qqbot;
