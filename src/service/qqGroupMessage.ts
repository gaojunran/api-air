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

/**
 * 发送群消息（支持 at 多个人）
 */
export async function sendGroup1Message(params: {
  ats: string[];
  text: string;
}) {
  const resp = await fetch(backendUrl + "/send_group_msg", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      group_id: group1Id,
      message: transformGroupSendMsg(params),
    }),
  });

  return await resp.json();
}

/**
 * 批量发送群消息（每个人收到不同的消息）
 */
export async function sendGroup1BatchMessages(data: {
  [qq: string]: string;
}) {
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
        message: createAtMessage(qq, text),
      }),
    });

    const json = await resp.json();
    results.push({ qq, result: json });
  }

  return { results };
}
