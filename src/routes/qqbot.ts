import { Hono } from "hono";
import { parseAtTextMessage } from "../service/qq.ts";
import { sendGroup1Message } from "../service/qqGroupMessage.ts";
import { simpleAnswer } from "../service/llm.ts";

const qqbot = new Hono();

qqbot.post("/", async (c) => {
  const result = parseAtTextMessage(c.get("jsonBody"));
  if (!result) return c.json({ message: "skipped" });

  const answer = await simpleAnswer(result.message);

  const res = await sendGroup1Message({
    ats: [result.sender.id],
    text: answer,
  });

  return c.json({ result: res });
});

export default qqbot;
