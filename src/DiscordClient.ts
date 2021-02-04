import Discord from 'discord.js'

export interface DiscordClientOptions {
  readonly devMode: null | {
    readonly testGuildId: string
  }
  readonly discordJsOptions?: Discord.ClientOptions
}

export class DiscordClient extends Discord.Client {
  private get _api(): any {
    // @ts-expect-error
    return this.api
  }
  private get _user(): Discord.ClientUser {
    const user = this.user
    if (!user) {
      throw new Error('No user, maybe client is not logged in?')
    }
    return user
  }
  private get _commandsApi(): DiscordResourceApi {
    const application = this._api.applications(this._user.id)
    const parent = this._devMode
      ? application.guilds(this._devMode.testGuildId)
      : application
    return parent.commands
  }
  private readonly _devMode: DiscordClientOptions['devMode']
  constructor({ devMode, discordJsOptions }: DiscordClientOptions) {
    super(discordJsOptions)
    this._devMode = devMode && { ...devMode }
    // auto-ack pings
    this.onInteraction(async (interaction, respond) => {
      if (interaction.type === InteractionType.Ping) {
        await respond({
          type: InteractionResponseType.Pong,
        })
        return
      }
    })
  }
  public async listCommands(): Promise<unknown> {
    return await this._commandsApi().get()
  }
  public async registerCommand({
    name,
    description,
    options,
  }: RegisterCommandParams): Promise<unknown> {
    return await this._commandsApi.post({
      data: { name, description, options },
    })
  }
  public onInteraction(listener: InteractionListener): () => void {
    // TODO: handle promise rejections??
    const callback = async (interaction: Interaction) => {
      const respond: InteractionResponder = async (response) => {
        return await this._api
          .interactions(interaction.id)(interaction.token)
          .callback.post({ data: response })
      }
      const send = async (
        message: InteractionApplicationCommandCallbackData,
      ) => {
        await this._api.webhooks(this._user.id)(interaction.token).post({
          data: message,
        })
      }
      await listener(interaction, respond, send)
    }
    this.ws.on('INTERACTION_CREATE' as any, callback)
    return () => {
      this.ws.off('INTERACTION_CREATE', callback)
    }
  }
}

// param types

export interface RegisterCommandParams {
  name: string
  description: string
  options?: Array<ApplicationCommandOption>
}

export type InteractionListener = (
  interaction: Interaction,
  respond: InteractionResponder,
  send: (
    message: InteractionApplicationCommandCallbackData,
  ) => Promise<unknown>,
) => void | Promise<void>

// param helper types

export type InteractionResponder = (
  response: InteractionResponse,
) => Promise<unknown>

// discord api types

enum ApplicationCommandOptionType {
  SubCommand = 1,
  SubCommandGroup = 2,
  String = 3,
  Integer = 4,
  Boolean = 5,
  User = 6,
  Channel = 7,
  Role = 8,
}

export { ApplicationCommandOptionType as OptionType }

interface ApplicationCommandOption {
  type: ApplicationCommandOptionType
  name: string
  description: string
  required?: boolean
  choices?: Array<ApplicationCommandOptionChoice>
  options?: Array<ApplicationCommandOption>
}

interface ApplicationCommandOptionChoice {
  name: string
  value: string | number
}

interface Interaction {
  id: string
  type: InteractionType
  data?: ApplicationCommandInteractionData
  guild_id: string
  channel_id: string
  // member: GuildMember
  token: string
  version: 1
}

enum InteractionType {
  Ping = 1,
  ApplicationCommand = 2,
}

interface ApplicationCommandInteractionData {
  // id: string
  name: string
  options?: Array<ApplicationCommandInteractionDataOption>
}

interface ApplicationCommandInteractionDataOption {
  name: string
  value?: string // ?
  options?: Array<ApplicationCommandInteractionDataOption>
}

interface InteractionResponse {
  type: InteractionResponseType
  data?: InteractionApplicationCommandCallbackData
}

interface InteractionApplicationCommandCallbackData {
  tts?: boolean
  content?: string
  // TODO
  embeds?: Array<object>
  allowed_mentions?: never // TODO
}

export enum InteractionResponseType {
  Pong = 1,
  Acknowledge = 2,
  ChannelMessage = 3,
  ChannelMessageWithSource = 4,
  AcknowledgeWithSource = 5,
}

// internal discord.js types

type DiscordResourceApi = ((id?: string) => DiscordResourceApi) & {
  get(): unknown
  post(options: DiscordRequestOptions): unknown
}

interface DiscordRequestOptions {
  data: unknown
}
