import { Hono } from "hono";
import {
  sendGroup1BatchMessages,
  sendGroup1Message,
} from "../service/qqGroupMessage.ts";

const qq = new Hono();

// 接受两种格式：
// 1. { ats: string[], text: string }
// 2. { [qq: string]: string } - QQ号:消息内容的键值对
qq.post("/group1/send", async (c) => {
  const data = c.get("jsonBody") as any;

  // 判断是哪种格式
  if (data.ats !== undefined && data.text !== undefined) {
    // 第一种格式：{ ats: string[], text: string }
    const json = await sendGroup1Message(data);
    return c.json(json);
  } else {
    // 第二种格式：{ [qq: string]: string } 批量发送
    const json = await sendGroup1BatchMessages(data);
    return c.json(json);
  }
});

export default qq;
