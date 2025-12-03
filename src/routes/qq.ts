import { Hono } from "hono";
import { sendGroupMessage } from "../service/qqGroupMessage.ts";

const qq = new Hono();

const group1Id = "770966394";

// 发送群1消息（固定群 ID）
// 请求格式：{ ats: string[], text: string }
qq.post("/group1/send", async (c) => {
  const data = c.get("jsonBody") as any;
  const json = await sendGroupMessage({
    groupId: group1Id,
    ats: data.ats,
    text: data.text,
  });
  return c.json(json);
});

// 发送任意群消息（需要指定群 ID）
// 请求格式：{ groupId: string, ats: string[], text: string }
qq.post("/group/send", async (c) => {
  const data = c.get("jsonBody") as any;
  const json = await sendGroupMessage(data);
  return c.json(json);
});

export default qq;
