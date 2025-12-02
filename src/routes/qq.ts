import { Hono } from "hono";

export const qq = new Hono();

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

  // at 之后加一个换行，再加文本
  msg.push({
    type: "text",
    data: { text: "\n" + text },
  });

  return msg;
}

// 接受：{ ats: string[], text: string }
qq.post("/group1/send", async (c) => {
  const data = c.get("jsonBody") as { ats: string[]; text: string };

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
});
