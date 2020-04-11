import leven from 'fast-levenshtein'
import stringify from 'json-stable-stringify'
import minBy from 'lodash/minBy'
import sortBy from 'lodash/sortBy'
import Lru from 'lru-cache'
import { ImgflipClient } from './ImgflipClient'
import { logger } from './logger'

export class MemeManager {
  private readonly _createMemeCache = new Lru<string, CreateMemeResult>({
    max: 1_000,
  })
  constructor(private readonly _imgflipClient: ImgflipClient) {}

  public async listTemplates({
    search,
    limit,
  }: ListTemplateParams): Promise<ListTemplatesResult> {
    const searchName = search ? normalizeTemplateName(search) : null

    // TODO: cache
    const allTemplates = (await this._imgflipClient.getTemplates()).map(
      (template) => ({
        ...template,
        normalizedName: normalizeTemplateName(template.name),
      }),
    )

    const templates: typeof allTemplates = (() => {
      if (!searchName) {
        return allTemplates
      }

      const substringTemplates: typeof allTemplates = []
      const nonSubstringTemplates: typeof allTemplates = []
      for (const template of allTemplates) {
        const subMatch = template.normalizedName.includes(searchName)
        ;(subMatch ? substringTemplates : nonSubstringTemplates).push(template)
      }

      return substringTemplates.length
        ? substringTemplates
        : nonSubstringTemplates
    })()

    const sorted = searchName
      ? sortBy(templates, (template) =>
          leven.get(searchName, template.normalizedName),
        )
      : templates

    return {
      templates: sorted.slice(0, limit).map((template) => ({
        id: template.id,
        name: template.name.toLowerCase(),
      })),
    }
  }

  public async createMeme(params: CreateMemeParams): Promise<CreateMemeResult> {
    const cacheKey = stringify(params)
    const cached = this._createMemeCache.get(cacheKey)
    if (cached) {
      return cached
    }
    const { name, captions } = params
    const { templates } = await this.listTemplates({ search: name, limit: 1 })
    const [closest] = templates
    if (!closest) {
      throw new Error('invariant violation: no closest')
    }
    const templateId = closest.id
    const imageUrl = await this._imgflipClient.createMeme({
      templateId,
      captions,
    })
    const result: CreateMemeResult = {
      imageUrl,
    }
    this._createMemeCache.set(cacheKey, result)
    return result
  }
}

function normalizeTemplateName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
}

export interface ListTemplateParams {
  limit: number
  search?: string
}

export interface ListTemplatesResult {
  templates: Array<{
    id: string
    name: string
  }>
}

export interface CreateMemeParams {
  name: string
  captions: string[]
}

export interface CreateMemeResult {
  imageUrl: string
}
