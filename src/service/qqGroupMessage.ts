const backendUrl = "http://codenebula.top:8082";
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

/**
 * 发送群消息（支持 at 多个人）
 */
export async function sendGroupMessage(params: {
  groupId: string;
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
      group_id: params.groupId,
      message: transformGroupSendMsg(params),
    }),
  });

  return await resp.json();
}
