import 'dotenv/config'

export const DEV_MODE = getVar('NODE_ENV') !== 'production'
export const DISCORD_BOT_TOKEN = requireVar('DISCORD_BOT_TOKEN')
export const IMGFLIP_API_USERNAME = requireVar('IMGFLIP_API_USERNAME')
export const IMGFLIP_API_PASSWORD = requireVar('IMGFLIP_API_PASSWORD')

function getVar(name: string): string | undefined {
  return process.env[name]
}

function requireVar(name: string): string {
  const value = getVar(name)
  if (!value) {
    throw new Error(`missing/empty environment variable: ${name}`)
  }
  return value
}
