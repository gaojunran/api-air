import { Hono } from "hono";
import qq from "./src/routes/qq.ts";
import qqbot from "./src/routes/qqbot.ts";

export const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// 中间件：验证请求体
app.use("*", async (c, next) => {
  if (c.req.method === "POST") {
    try {
      const body = await c.req.json();
      c.set("jsonBody", body);
    } catch {
      // 如果JSON解析失败，继续处理
    }
  }
  await next();
});

app.route("/qq", qq);
app.route("/qqbot", qqbot);

// 404处理
app.notFound((c) => {
  return c.json({ error: "接口不存在" }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error("服务器错误:", err);
  return c.json({ error: err }, 500);
});

Deno.serve(app.fetch);
