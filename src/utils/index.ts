// waiting for https://github.com/tc39/proposal-throw-expressions
export const throwIfNil = <T>(
  value: T | null | undefined,
  message: string = "Value is null or undefined",
): T => {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
};

export const requireEnv = (key: string): string => {
  return throwIfNil(
    Deno.env.get(key),
    `Environment variable ${key} is required`,
  );
};

export const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

export const nowBeijing = (): string => {
  return new Date().toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
