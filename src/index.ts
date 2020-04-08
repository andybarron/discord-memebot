import Discord from 'discord.js'
import { ImgflipClient } from './ImgflipClient'
import { logger } from './logger'
import { MemeManager } from './MemeManager'
import {
  IMGFLIP_API_PASSWORD,
  IMGFLIP_API_USERNAME,
  DISCORD_BOT_TOKEN,
} from './config'

async function main() {
  const manager = new MemeManager(
    new ImgflipClient(IMGFLIP_API_USERNAME, IMGFLIP_API_PASSWORD),
  )
  const client = new Discord.Client()

  client.on('ready', () => {
    logger.info('discord client ready')
  })

  client.on('message', async (message) => {
    try {
      const { content } = message
      const prefix = '!meme'
      if (!message.author.bot && content.split(/\s+/)[0] === prefix) {
        const argText = content.substring(prefix.length).replace(/^\s+/, '')
        const args = argText.split(/(?:[^\\])\|/).map((arg) => arg.trim())
        logger.info({ args })
        if (args.length < 2) {
          message.channel.send([
            'Command format:',
            '`!meme template name | caption 1`',
            '`!meme template name | caption 1 | caption 2` (etc)',
            'Example:',
            '`!meme is this a pigeon | me | writing discord bots | is this a hobby?`',
          ])
          return
        }
        const [name, ...captions] = args
        const result = await manager.createMeme({ name, captions })
        await message.channel.send(result.imageUrl)
      }
    } catch (err) {
      logger.error(
        { err, messageContent: message.content },
        'Error handling message',
      )
    }
  })

  client.login(DISCORD_BOT_TOKEN)
}

main().catch((err) => logger.error({ err }))
