import "dotenv/config";

export const DEV_MODE = getVar("NODE_ENV") !== "production";

// TODO: Discord client credentials token

export const IMGFLIP_API_USERNAME = requireVar("IMGFLIP_API_USERNAME");
export const IMGFLIP_API_PASSWORD = requireVar("IMGFLIP_API_PASSWORD");

function getVar(name: string): string | undefined {
  return process.env[name];
}

function requireVar(name: string): string {
  const value = getVar(name);
  if (!value) {
    throw new Error(`missing/empty environment variable: ${name}`);
  }
  return value;
}
