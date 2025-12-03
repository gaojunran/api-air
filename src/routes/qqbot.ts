import { Hono } from "hono";
import { HandlerResponse } from "hono/types";
import { parseAtTextMessage } from "../service/qq.ts";

const qqbot = new Hono();

qqbot.post("/", (c) => {
  const result = parseAtTextMessage(c.get("jsonBody"));
  console.log(result);
  return c.json({ result });
});

export default qqbot;
