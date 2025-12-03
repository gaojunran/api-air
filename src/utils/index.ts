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
