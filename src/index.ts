export type ApostleEffect = {onSuccess: (response: Response) => Promise<void>, onError: (error: unknown) => Promise<void>}
export type ApostleTransformer = {request: (body: Record<string, any>) => Record<string, any>, response: (body: Record<string, any>) => Record<string, any>}
export type ApostleInterceptor = (init: RequestInit) => RequestInit
export type ApostleRequestBody = Record<string, any> | string | FormData | URLSearchParams
export type ApostleResponseType = 'arrayBuffer' | 'blob' | 'clone' | 'formData' | 'json' | 'text' | 'raw'
export type ApostleDefaultsOptions = {
  responseType: ApostleResponseType
}
export type ApostleConstructorOptions = {
  baseURL?: string,
  init?: RequestInit,
  effect?: ApostleEffect,
  transformer?: ApostleTransformer,
  interceptor?: ApostleInterceptor,
  defaults?: ApostleDefaultsOptions
}

export class Apostle {
  private baseURL?: string
  private init: RequestInit
  private effect: ApostleEffect
  private transformer: ApostleTransformer
  private interceptor: ApostleInterceptor
  private defaults: ApostleDefaultsOptions = {
    responseType: 'raw'
  }

  constructor(options: ApostleConstructorOptions) {
    this.baseURL = options.baseURL
    this.init = options.init ?? {}
    this.effect = options.effect ?? {onSuccess: async () => {}, onError: async () => {}}
    this.transformer = options.transformer ?? {request: (body) => body, response: (body) => body}
    this.interceptor = options.interceptor ?? ((init) => init)
    if (options.defaults?.responseType) this.defaults.responseType = options.defaults.responseType
  }

  public async dispatch(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    query?: Record<string, string | undefined>,
    body?: ApostleRequestBody,
    responseType: ApostleResponseType = this.defaults.responseType,
    init: RequestInit = {},
  ) {
    try {
      if (query) Object.keys(query).forEach(key => {if (query[key] === undefined || query[key] === null) delete query[key]});
      const isBodyPlainObject = body && body.constructor === Object
      const inferredHeaders: HeadersInit = {}
      if (isBodyPlainObject) inferredHeaders['Content-Type'] = 'application/json'
      const response = await fetch(
        `${url}?${new URLSearchParams(query as Record<string, string>)}`,
        {
          ...this.interceptor({...this.init, ...init}),
          headers: {...inferredHeaders, ...this.init.headers, ...init.headers},
          body: isBodyPlainObject ? JSON.stringify(this.transformer.request(body as Record<string, string>)) : body as Exclude<ApostleRequestBody, Record<string, string>>,
          method
        }
      )
      if (!response.ok) throw response
      await this.effect.onSuccess(response)
      return this.transformer.response(responseType === 'raw' ? response : await response[responseType]())
    } catch (response) {
      throw await this.effect.onError(response as Response)
    }
  }

  public async get(path: string | {path: string, query?: Record<string, string>}, responseType?: ApostleResponseType, init?: RequestInit) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch('GET', `${this.baseURL}/${pathObject.path}`, pathObject.query, undefined, responseType, init)
    } catch (error) {
      throw error
    }
  }

  public async post(path: string | {path: string, query?: Record<string, string>}, body?: ApostleRequestBody, responseType?: ApostleResponseType, init?: RequestInit) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch('POST', `${this.baseURL}/${pathObject.path}`, pathObject.query, body, responseType, init)
    } catch (error) {
      throw error
    }
  }

  public async put(path: string | {path: string, query?: Record<string, string>}, body?: ApostleRequestBody, responseType?: ApostleResponseType, init?: RequestInit) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch('PUT', `${this.baseURL}/${pathObject.path}`, pathObject.query, body, responseType, init)
    } catch (error) {
      throw error
    }
  }

  public async patch(path: string | {path: string, query?: Record<string, string>}, body?: ApostleRequestBody, responseType?: ApostleResponseType, init?: RequestInit) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch('PATCH', `${this.baseURL}/${pathObject.path}`, pathObject.query, body, responseType, init)
    } catch (error) {
      throw error
    }
  }

  public async delete(path: string | {path: string, query?: Record<string, string>}, body?: ApostleRequestBody, responseType?: ApostleResponseType, init?: RequestInit) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch('DELETE', `${this.baseURL}/${pathObject.path}`, pathObject.query, body, responseType, init)
    } catch (error) {
      throw error
    }
  }
}