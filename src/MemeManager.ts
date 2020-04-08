import leven from 'fast-levenshtein'
import stringify from 'json-stable-stringify'
import minBy from 'lodash/minBy'
import Lru from 'lru-cache'
import { ImgflipClient } from './ImgflipClient'
import { logger } from './logger'

export class MemeManager {
  private readonly _createMemeCache = new Lru<string, CreateMemeResult>()
  constructor(private readonly _imgflipClient: ImgflipClient) {}

  public async createMeme(params: CreateMemeParams): Promise<CreateMemeResult> {
    const cacheKey = stringify(params)
    const cached = this._createMemeCache.get(cacheKey)
    if (cached) {
      return cached
    }
    const { name, captions } = params
    // TODO: cache
    const allTemplates = (await this._imgflipClient.getTemplates()).map(
      (template) => ({
        ...template,
        normalizedName: normalizeTemplateName(template.name),
      }),
    )
    const searchName = normalizeTemplateName(name)
    const substringTemplates: TemplateData[] = []
    const nonSubstringTemplates: TemplateData[] = []
    for (const template of allTemplates) {
      const subMatch = template.normalizedName.includes(searchName)
      ;(subMatch ? substringTemplates : nonSubstringTemplates).push(template)
    }
    const templates = substringTemplates.length
      ? substringTemplates
      : nonSubstringTemplates
    const closest = minBy(templates, (template) => {
      return leven.get(searchName, normalizeTemplateName(template.name))
    })
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

interface TemplateData {
  id: string
  name: string
  normalizedName: string
}

function normalizeTemplateName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
}

export interface CreateMemeParams {
  name: string
  captions: string[]
}

export interface CreateMemeResult {
  imageUrl: string
}
