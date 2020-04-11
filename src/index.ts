import Discord from 'discord.js'
import { ImgflipClient } from './ImgflipClient'
import { logger } from './logger'
import { MemeManager } from './MemeManager'
import {
  IMGFLIP_API_PASSWORD,
  IMGFLIP_API_USERNAME,
  DISCORD_BOT_TOKEN,
} from './config'
import { splitOnValue } from './arrayUtils'

async function main() {
  const manager = new MemeManager(
    new ImgflipClient(IMGFLIP_API_USERNAME, IMGFLIP_API_PASSWORD),
  )
  const client = new Discord.Client()

  client.on('ready', () => {
    logger.debug('discord client ready')
  })

  client.on('message', async (message) => {
    try {
      if (message.author.bot) {
        return
      }

      const { content } = message
      if (content.length > 2_000) {
        return
      }
      const words = content.split(/\s+/).filter((word) => word)
      const [command, ...args] = words

      if (command === '!meme') {
        // TODO: preserve whitespace?
        const memeArgs = splitOnValue('|', args).map((chunk) => chunk.join(' '))
        const valid = memeArgs.length && memeArgs[0].length
        if (!valid) {
          throw new InvalidArgsError()
        }
        const [name, ...captions] = memeArgs
        const result = await manager.createMeme({ name, captions })
        await message.channel.send(undefined, { files: [result.imageUrl] })
      } else if (command === '!memesearch') {
        if (!args.length) {
          throw new InvalidArgsError()
        }
        const search = args.join(' ')
        const { templates } = await manager.listTemplates({
          search,
          limit: 10,
        })
        await message.channel.send([
          `**Search:** \`${search}\``, // TODO: escape backticks
          '**Template results**',
          ...templates.map((template) => template.name),
        ])
      } else if (command === '!memelist') {
        if (args.length) {
          throw new InvalidArgsError()
        }
        const { templates } = await manager.listTemplates({
          limit: 20,
        })
        await message.channel.send([
          `**Top ${templates.length} templates**`,
          ...templates.map((template) => template.name),
        ])
      }
    } catch (err) {
      if (err instanceof InvalidArgsError) {
        message.channel.send([
          '**Commands**',
          '• `!memelist`',
          '• `!memesearch [search terms]`',
          '• `!meme [template name]`',
          '• `!meme [template name] | [caption 1]`',
          '• `!meme [template name] | [caption 1] | [caption 2] | ...`',
          '',
          '**Examples**',
          '• `!memesearch surprised pikachu`',
          '• `!meme two buttons | make memes | do literally anything else`',
          '• `!meme pigeon | me | writing discord bots | is this a hobby?`',
        ])
      } else {
        logger.error(
          { err, messageContent: message.content },
          'Error handling message',
        )
      }
    }
  })

  client.login(DISCORD_BOT_TOKEN)
}

class InvalidArgsError extends Error {}

main().catch((err) => logger.error({ err }))
