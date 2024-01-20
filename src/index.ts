type ApostleEffect = {onSuccess: (response: Response) => Promise<void>, onError: (error: unknown) => Promise<void>}
type ApostleTransformer = {request: (body: Record<string, any>) => Record<string, any>, response: (body: Record<string, any>) => Record<string, any>}

class Apostle {
  private baseURL: string
  private init?: RequestInit
  private effect: ApostleEffect
  private transformer: ApostleTransformer

  constructor(baseURL: string, init?: RequestInit, effect?: ApostleEffect, transformer?: ApostleTransformer) {
    this.baseURL = baseURL
    this.init = init
    this.effect = effect || {onSuccess: async () => {}, onError: async () => {}}
    this.transformer = transformer || {request: (body) => body, response: (body) => body}
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

  public async get(path: string, query?: Record<string, string>) {
    try {
      return await this.dispatch(path, query, undefined, {method: 'GET'})
    } catch (error) {
      throw error
    }
  }

  public async post(path: string, options?: {query?: Record<string, string>, body?: Record<string, any>}) {
    try {
      return await this.dispatch(path, options?.query, options?.body, {method: 'POST'})
    } catch (error) {
      throw error
    }
  }

  public async put(path: string, options?: {query?: Record<string, string>, body?: Record<string, any>}) {
    try {
      return await this.dispatch(path, options?.query, options?.body, {method: 'PUT'})
    } catch (error) {
      throw error
    }
  }

  public async patch(path: string, options?: {query?: Record<string, string>, body?: Record<string, any>}) {
    try {
      return await this.dispatch(path, options?.query, options?.body, {method: 'PATCH'})
    } catch (error) {
      throw error
    }
  }

  public async delete(path: string, options?: {query?: Record<string, string>, body?: Record<string, any>}) {
    try {
      return await this.dispatch(path, options?.query, options?.body, {method: 'DELETE'})
    } catch (error) {
      throw error
    }
  }
}