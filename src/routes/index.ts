import { Hono } from "hono";
import { UserService } from "../services/userService.ts";
import { SigninService } from "../services/signinService.ts";
import { LogService, LogAction } from "../services/logService.ts";
import type {
  AddUserRequest,
  RemoveUserRequest,
  RenameUserRequest,
  RefreshCookieRequest,
  SetAutoRequest,
  UpdateIdentityRequest,
  SigninRequest,
  DigitalSigninRequest,
  AddUserResponse,
  SigninResponse,
  UserWithCookie,
} from "../types/index.ts";
import { qq } from "./qq.ts";

const app = new Hono();

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

// 404处理
app.notFound((c) => {
  return c.json({ error: "接口不存在" }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error("服务器错误:", err);
  return c.json({ error: err }, 500);
});

export default app;
