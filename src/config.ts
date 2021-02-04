import 'dotenv/config'

export const DEV_MODE = getVar('NODE_ENV') !== 'production'
export const DISCORD_BOT_TOKEN = requireVar('DISCORD_BOT_TOKEN')
export const DISCORD_TEST_GUILD_ID = DEV_MODE
  ? requireVar('DISCORD_TEST_GUILD_ID')
  : ''
export const IMGFLIP_API_USERNAME = requireVar('IMGFLIP_API_USERNAME')
export const IMGFLIP_API_PASSWORD = requireVar('IMGFLIP_API_PASSWORD')

// TODO: fix hard-coded app ID
export const INSTALL_URL =
  'https://discord.com/oauth2/authorize?client_id=697381192806170694&permissions=0&scope=applications.commands%20bot'

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
