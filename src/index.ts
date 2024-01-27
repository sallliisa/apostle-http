export type ApostleEffect = {onSuccess: (response: Response) => Promise<void>, onError: (error: unknown) => Promise<void>}
export type ApostleTransformer = {request: (body: Record<string, any>) => Record<string, any>, response: (body: Record<string, any>) => Record<string, any>}
export type ApostleInterceptor = (init: RequestInit) => RequestInit
export type ApostleRequestBody = Record<string, any> | string | FormData | URLSearchParams
export type ApostleResponseType = 'arrayBuffer' | 'blob' | 'clone' | 'formData' | 'json' | 'text' | 'raw'
export type ApostleRequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ApostleRequestObject = {
  method: ApostleRequestMethod,
  url: string,
  query?: Record<string, string | undefined>,
  body?: ApostleRequestBody,
  responseType?: ApostleResponseType,
  init?: RequestInit,
}

export type ApostleConfiguration = {
  defaultResponseType: ApostleResponseType,
  inferRequestBodyContentType: boolean,
  inferResponseBodyContentType: boolean,
  parseObjectAsJSON: boolean
}

export type ApostleConstructorOptions = {
  baseURL?: string,
  init?: RequestInit,
  effect?: ApostleEffect,
  transformer?: ApostleTransformer,
  interceptor?: ApostleInterceptor,
  config?: Partial<ApostleConfiguration>
}

const ianaMediaTypeMethodMap: Record<string, ApostleResponseType> = {
  "application/xhtml+xml": "text",
  "application/json": "json",
  "application/ld+json": "json",
  "application/xml": "text",
  "image/svg+xml": "text",
}

const ianaRegistriesMethodMap: Record<string, ApostleResponseType> = {
  "application": "blob",
  "audio": "blob",
  "font": "blob",
  "example": "text",
  "image": "blob",
  "message": "text",
  "model": "blob",
  "multipart": "formData",
  "text": "text",
  "video": "blob"
}

export class Apostle {
  private baseURL?: string
  private init: RequestInit
  private effect: ApostleEffect
  private transformer: ApostleTransformer
  private interceptor: ApostleInterceptor
  private config: ApostleConfiguration

  constructor(options: ApostleConstructorOptions) {
    this.baseURL = options.baseURL
    this.init = options.init ?? {}
    this.effect = options.effect ?? {onSuccess: async () => {}, onError: async () => {}}
    this.transformer = options.transformer ?? {request: (body) => body, response: (body) => body}
    this.interceptor = options.interceptor ?? ((init) => init)
    this.config = {
      defaultResponseType: options.config?.defaultResponseType ?? 'text',
      inferRequestBodyContentType: options.config?.inferRequestBodyContentType ?? false,
      inferResponseBodyContentType: options.config?.inferResponseBodyContentType ?? false,
      parseObjectAsJSON: options.config?.parseObjectAsJSON ?? true
    }
  }

  public async dispatch({method, url, query, body, responseType, init}: ApostleRequestObject) {
    try {
      const parsedInit = this.interceptor({...this.init, ...init})
      if (query) Object.keys(query).forEach(key => {if (query[key] === undefined || query[key] === null) delete query[key]});
      
      const parseBodyAsJSON = body && body.constructor === Object && this.config.parseObjectAsJSON
      const parsedHeaders = new Headers(parsedInit.headers)
      if (this.config.inferRequestBodyContentType) {
        if (parseBodyAsJSON) parsedHeaders.set('Content-Type', 'application/json')
        // TODO: Validate that the rest is automatically inferred by the browser
      }

      const response = await fetch(
        `${url}?${new URLSearchParams(query as Record<string, string>)}`,
        {
          ...parsedInit,
          headers: parsedHeaders,
          body: parseBodyAsJSON ? JSON.stringify(this.transformer.request(body as Record<string, string>)) : body as Exclude<ApostleRequestBody, Record<string, string>>,
          method
        }
      )

      if (!response.ok) throw response

      if (this.config.inferResponseBodyContentType && !responseType) {
        const responseContentType = response.headers.get('Content-Type')
        if (responseContentType) {
          if (ianaMediaTypeMethodMap[responseContentType]) responseType = ianaMediaTypeMethodMap[responseContentType]
          else responseType = ianaRegistriesMethodMap[responseContentType.split("/")[0]]
        }
      }
      if (!responseType) responseType = this.config.defaultResponseType

      await this.effect.onSuccess(response)
      return this.transformer.response(responseType === 'raw' ? response : await response[responseType]())
    } catch (response) {
      throw await this.effect.onError(response as Response)
    }
  }

  public async get(path: string | {path: string, query?: Record<string, string>}, responseType?: ApostleResponseType, init?: RequestInit) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch({method: 'GET', url: `${this.baseURL}${pathObject.path}`, query: pathObject.query, responseType, init})
    } catch (error) {
      throw error
    }
  }

  public async post(path: string | {path: string, query?: Record<string, string>}, body?: ApostleRequestBody, responseType?: ApostleResponseType, init?: RequestInit) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch({method: 'POST', url: `${this.baseURL}${pathObject.path}`, query: pathObject.query, body, responseType, init})
    } catch (error) {
      throw error
    }
  }

  public async put(path: string | {path: string, query?: Record<string, string>}, body?: ApostleRequestBody, responseType?: ApostleResponseType, init?: RequestInit) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch({method: 'PUT', url: `${this.baseURL}${pathObject.path}`, query: pathObject.query, body, responseType, init})
    } catch (error) {
      throw error
    }
  }

  public async patch(path: string | {path: string, query?: Record<string, string>}, body?: ApostleRequestBody, responseType?: ApostleResponseType, init?: RequestInit) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch({method: 'PATCH', url: `${this.baseURL}${pathObject.path}`, query: pathObject.query, body, responseType, init})
    } catch (error) {
      throw error
    }
  }

  public async delete(path: string | {path: string, query?: Record<string, string>}, body?: ApostleRequestBody, responseType?: ApostleResponseType, init?: RequestInit) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch({method: 'DELETE', url: `${this.baseURL}${pathObject.path}`, query: pathObject.query, body, responseType, init})
    } catch (error) {
      throw error
    }
  }
}