export type ApostleEffect = {onSuccess: (response: Response) => Promise<void>, onError: (error: unknown) => Promise<void>}
export type ApostleTransformer = {request: (body: Record<string, any>) => Record<string, any>, response: (body: Record<string, any>) => Record<string, any>}

export class Apostle {
  private baseURL: string
  private init?: RequestInit
  private effect: ApostleEffect
  private transformer: ApostleTransformer

  constructor(
    baseURL: string,
    init?: RequestInit,
    effect: ApostleEffect = {onSuccess: async () => {}, onError: async () => {}},
    transformer: ApostleTransformer = {request: (body) => body, response: (body) => body}
  ) {
    this.baseURL = baseURL
    this.init = init
    this.effect = effect
    this.transformer = transformer
  }

  public async dispatch(path: string, query?: Record<string, string>, body?: Record<string, any>, init?: Partial<RequestInit>) {
    try {
      const response = await fetch(
        `${this.baseURL}/${path}?${new URLSearchParams(query)}`,
        {
          ...this.init,
          ...init,
          body: body ? JSON.stringify(this.transformer.request(body)) : undefined
        }
      )
      if (!response.ok) throw response
      await this.effect.onSuccess(response)
      return this.transformer.response(await response.json())
    } catch (response) {
      throw await this.effect.onError(response as Response)
    }
  }

  public async get(path: string | {url: string, query?: Record<string, string>}) {
    try {
      const pathObject = typeof path === 'string' ? {url: path} : path
      return await this.dispatch(pathObject.url, pathObject.query, undefined, {method: 'GET'})
    } catch (error) {
      throw error
    }
  }

  public async post(path: string | {url: string, query?: Record<string, string>}, body?: Record<string, any>) {
    try {
      const pathObject = typeof path === 'string' ? {url: path} : path
      return await this.dispatch(pathObject.url, pathObject.query, body, {method: 'POST'})
    } catch (error) {
      throw error
    }
  }

  public async put(path: string | {url: string, query?: Record<string, string>}, body?: Record<string, any>) {
    try {
      const pathObject = typeof path === 'string' ? {url: path} : path
      return await this.dispatch(pathObject.url, pathObject.query, body, {method: 'PUT'})
    } catch (error) {
      throw error
    }
  }

  public async patch(path: string | {url: string, query?: Record<string, string>}, body?: Record<string, any>) {
    try {
      const pathObject = typeof path === 'string' ? {url: path} : path
      return await this.dispatch(pathObject.url, pathObject.query, body, {method: 'PATCH'})
    } catch (error) {
      throw error
    }
  }

  public async delete(path: string | {url: string, query?: Record<string, string>}, body?: Record<string, any>) {
    try {
      const pathObject = typeof path === 'string' ? {url: path} : path
      return await this.dispatch(pathObject.url, pathObject.query, body, {method: 'DELETE'})
    } catch (error) {
      throw error
    }
  }
}