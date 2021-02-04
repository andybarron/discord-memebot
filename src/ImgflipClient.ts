import axios from "axios";
import qs from "qs";
import * as t from "runtypes";
import {logger} from "./logger";

export class ImgflipClient {
  private _axios = axios.create({
    baseURL: "https://api.imgflip.com",
  });
  public constructor(public username: string, public password: string) {}
  private async _request<T>(
    schema: t.Runtype<T>,
    ...args: Parameters<ImgflipClient["_axios"]["request"]>
  ): Promise<T> {
    const response = await this._axios.request<unknown>(...args);
    try {
      return schema.check(response.data);
    } catch (err) {
      logger.error(
        {err, responseData: response.data},
        "Error validating schema request",
      );
      throw err;
    }
  }
  async getTemplates() {
    const response = await this._request(GetMemesResponseSchema, {
      url: "/get_memes",
    });
    return response.data.memes;
  }
  // TODO: validate number of boxes
  async createMeme({templateId, captions}: CreateMemeParams): Promise<string> {
    const params = {
      template_id: templateId,
      // TODO: just return the template blank default URL
      boxes: captions.length ? captions.map((text) => ({text})) : [{text: " "}],
      username: this.username,
      password: this.password,
    };
    const postBody = qs.stringify(params);
    const response = await this._request(CaptionImageResponseSchema, {
      url: "/caption_image",
      data: postBody,
      method: "POST",
    });
    return response.data.url;
  }
}

export interface CreateMemeParams {
  templateId: string;
  captions: string[];
}

const GetMemesResponseSchema = t.Record({
  success: t.Literal(true),
  data: t.Record({
    memes: t.Array(
      t.Record({
        id: t.String,
        name: t.String,
        url: t.String,
      }),
    ),
  }),
});

const CaptionImageResponseSchema = t.Record({
  success: t.Literal(true),
  data: t.Record({
    url: t.String,
  }),
});
