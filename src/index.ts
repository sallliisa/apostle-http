export type ApostleEffect = {onSuccess: (response: Response) => Promise<void>, onError: (error: unknown) => Promise<void>}
export type ApostleTransformer = {request: (body: Record<string, any>) => Record<string, any>, response: (body: Record<string, any>) => Record<string, any>}
export type ApostleInterceptor = (init: RequestInit) => RequestInit
export type ApostleRequestBody = Record<string, any> | string | FormData | URLSearchParams

export class Apostle {
  private baseURL: string
  private init: RequestInit
  private effect: ApostleEffect
  private transformer: ApostleTransformer
  private interceptor: ApostleInterceptor

  constructor(
    baseURL: string,
    init: RequestInit = {},
    effect: ApostleEffect = {onSuccess: async () => {}, onError: async () => {}},
    transformer: ApostleTransformer = {request: (body) => body, response: (body) => body},
    interceptor: ApostleInterceptor = (init) => init
  ) {
    this.baseURL = baseURL
    this.init = init
    this.effect = effect
    this.transformer = transformer
    this.interceptor = interceptor
  }

  public async dispatch(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    query?: Record<string, string>,
    body?: ApostleRequestBody,
    init?: RequestInit
  ) {
    try {

      const isBodyPlainObject = body && body.constructor === Object
      const requestHeaders: HeadersInit = {...this.init.headers, ...init?.headers}
      if (isBodyPlainObject) (requestHeaders as Record<string, string>)['Content-Type'] = 'application/json'

      const response = await fetch( 
        `${this.baseURL}/${path}?${new URLSearchParams(query)}`,
        {
          ...this.interceptor({...this.init, ...init}),
          headers: requestHeaders,
          body:
            isBodyPlainObject ?
              JSON.stringify(this.transformer.request(body as Record<string, string>)) 
                :
              body as Exclude<ApostleRequestBody, Record<string, string>>,
          method
        }
      )

      if (!response.ok) throw response
      await this.effect.onSuccess(response)
      return this.transformer.response(await response.json())
    } catch (response) {
      throw await this.effect.onError(response as Response)
    }
  }

  public async get(path: string | {path: string, query?: Record<string, string>}, init?: RequestInit) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch('GET', pathObject.path, pathObject.query, undefined, init)
    } catch (error) {
      throw error
    }
  }

  public async post(path: string | {path: string, query?: Record<string, string>}, body?: ApostleRequestBody, init?: RequestInit) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch('POST', pathObject.path, pathObject.query, body, init)
    } catch (error) {
      throw error
    }
  }

  public async put(path: string | {path: string, query?: Record<string, string>}, body?: ApostleRequestBody, init?: RequestInit) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch('PUT', pathObject.path, pathObject.query, body, init)
    } catch (error) {
      throw error
    }
  }

  public async patch(path: string | {path: string, query?: Record<string, string>}, body?: ApostleRequestBody, init?: RequestInit) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch('PATCH', pathObject.path, pathObject.query, body, init)
    } catch (error) {
      throw error
    }
  }

  public async delete(path: string | {path: string, query?: Record<string, string>}, body?: ApostleRequestBody, init?: RequestInit) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch('DELETE', pathObject.path, pathObject.query, body, init)
    } catch (error) {
      throw error
    }
  }
}