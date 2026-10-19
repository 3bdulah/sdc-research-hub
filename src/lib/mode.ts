export const APP_MODES = ["demo", "private"] as const;
export type AppMode = (typeof APP_MODES)[number];

export function getAppMode(value = process.env.APP_MODE): AppMode {
  return value === "private" ? "private" : "demo";
}

export function privateDataPath(value = process.env.PRIVATE_DATA_PATH): string {
  return value?.startsWith("private/") || value?.startsWith("./private/") ? value : "./private";
}
