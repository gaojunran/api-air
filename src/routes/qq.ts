import { Hono } from "hono";

const qq = new Hono();

const backendUrl = "http://codenebula.top:8082";
const group1Id = "770966394";
const token = "nebulagjr0303";

interface TransformGroupSendMsgParams {
  ats: string[];
  text: string;
}

function transformGroupSendMsg({ ats, text }: TransformGroupSendMsgParams) {
  const msg: { type: string; data: { qq?: string; text?: string } }[] = [];

  // 先把所有 at 放进去
  ats.forEach((qq) => {
    msg.push({
      type: "at",
      data: { qq },
    });
  });

  // at 之后加一个换行（如果有 at），再加文本
  msg.push({
    type: "text",
    data: { text: ats.length > 0 ? "\n" + text : text },
  });

  return msg;
}

// 生成单个 at + 文本消息
function createAtMessage(qq: string, text: string) {
  return [
    {
      type: "at",
      data: { qq },
    },
    {
      type: "text",
      data: { text: "\n" + text },
    },
  ];
}

// 接受两种格式：
// 1. { ats: string[], text: string }
// 2. { [qq: string]: string } - QQ号:消息内容的键值对
qq.post("/group1/send", async (c) => {
  const data = c.get("jsonBody") as any;

  // 判断是哪种格式
  if (data.ats !== undefined && data.text !== undefined) {
    // 第一种格式：{ ats: string[], text: string }
    const resp = await fetch(backendUrl + "/send_group_msg", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        group_id: group1Id,
        message: transformGroupSendMsg(data),
      }),
    });

    const json = await resp.json();
    return c.json(json);
  } else {
    // 第二种格式：{ [qq: string]: string } 批量发送
    const results = [];

    for (const [qq, text] of Object.entries(data)) {
      const resp = await fetch(backendUrl + "/send_group_msg", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group_id: group1Id,
          message: createAtMessage(qq, text as string),
        }),
      });

      const json = await resp.json();
      results.push({ qq, result: json });
    }

    return c.json({ results });
  }
});

export default qq;
