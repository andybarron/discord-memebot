import { strict as assert } from 'assert'
import {
  DiscordClient,
  InteractionResponseType,
  OptionType,
} from './DiscordClient'
import { ImgflipClient } from './ImgflipClient'
import { logger } from './logger'
import { MemeManager } from './MemeManager'
import {
  IMGFLIP_API_PASSWORD,
  IMGFLIP_API_USERNAME,
  DISCORD_BOT_TOKEN,
  DISCORD_TEST_GUILD_ID,
  DEV_MODE,
} from './config'

async function main() {
  const manager = new MemeManager(
    new ImgflipClient(IMGFLIP_API_USERNAME, IMGFLIP_API_PASSWORD),
  )
  const client = new DiscordClient({
    devMode: DEV_MODE
      ? {
          testGuildId: DISCORD_TEST_GUILD_ID,
        }
      : null,
  })

  client.on('ready', () => {
    logger.debug('discord client ready')
  })

  await client.login(DISCORD_BOT_TOKEN)

  // TODO: Delete old unused slash commands
  // await client.listCommands()

  // Register slash commands
  await client.registerCommand({
    name: 'mbt',
    description: 'Create a meme or find a template',
    options: [
      {
        type: OptionType.SubCommand,
        name: 'create',
        description: 'Create a new meme',
        options: [
          {
            type: OptionType.String,
            name: 'input',
            description: 'template | line 1 | line 2 | etc',
            required: true,
          },
        ],
      },
      {
        type: OptionType.SubCommand,
        name: 'list',
        description: 'List top meme templates',
      },
      {
        type: OptionType.SubCommand,
        name: 'search',
        description: 'Search available meme templates',
        options: [
          {
            type: OptionType.String,
            name: 'query',
            description: 'Meme template text to search for',
            required: true,
          },
        ],
      },
    ],
  })

  // Respond to interactions
  client.onInteraction(async (interaction, respond, send) => {
    await respond({
      type: InteractionResponseType.AcknowledgeWithSource,
    })
    console.log(interaction)
    const command = interaction.data?.options?.[0]
    assert(command)
    // TODO: display box counts
    switch (command.name) {
      case 'list': {
        const { templates } = await manager.listTemplates({
          limit: 20,
        })
        const content = [
          `**Top ${templates.length} templates**`,
          ...formatListResult(templates),
        ].join('\n')
        await send({ content })
        break
      }
      case 'search': {
        const search = command.options?.find(
          (option) => option.name === 'query',
        )?.value
        assert(search)
        const { templates } = await manager.listTemplates({
          search,
          limit: 10,
        })
        const content = [
          `**Search:** \`${search}\``, // TODO: escape backticks
          '**Template results**',
          ...formatListResult(templates),
        ].join('\n')
        await send({ content })
        break
      }
      case 'create': {
        const input = command.options?.find((option) => option.name === 'input')
          ?.value
        assert(typeof input === 'string')

        const parts = input.split('|').map((part) => part.trim())

        const [template, ...captions] = parts

        if (!template) {
          await send({
            content: 'Please specify a meme template :speak_no_evil:',
          })
          break
        }

        const result = await manager.createMeme({
          name: template,
          captions,
        })

        await send({
          embeds: [
            {
              image: {
                url: result.imageUrl,
              },
              type: 'image',
            },
          ],
        })
        break
      }
      default: {
        await send({ content: 'Something went wrong :sob:' })
        break
      }
    }
  })

  // respond to legacy calls
  client.on('message', async (message) => {
    if (message.author.bot) {
      return
    }

    const shouldReply = message.content.toLowerCase().trim().startsWith('!meme')

    if (!shouldReply) {
      return
    }

    await message.channel.send([
      "I've leveled up! Type `/mbt` to see my new command list :blush:",
    ])
  })

  logger.debug('App started')
}

function formatListResult(templates: { name: string }[]): string[] {
  return templates.map((template) => `• ${template.name}`)
}

main().catch(async (err) => {
  logger.error({ err }, 'App error in main()')
  await new Promise((resolve) => setTimeout(resolve, 5_000))
  process.exit(-1)
})
