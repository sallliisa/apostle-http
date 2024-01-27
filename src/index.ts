export type ApostleEffect = {onSuccess: (response: Response) => Promise<void>, onError: (error: unknown) => Promise<void>}
export type ApostleTransformer = {request: (body: Record<string, any>) => Record<string, any>, response: (body: Record<string, any>) => Record<string, any>}
export type ApostleInterceptor = (init: RequestInit) => RequestInit
export type ApostleRequestBody = Record<string, any> | string | FormData | URLSearchParams
export type ApostleResponseType = 'arrayBuffer' | 'blob' | 'clone' | 'formData' | 'json' | 'text' | 'raw'
export type ApostleConfiguration = {
  responseType?: ApostleResponseType,
  inferRequestBodyContentType?: boolean,
  inferResponseBodyContentType?: boolean
}
export type ApostleConstructorOptions = {
  baseURL?: string,
  init?: RequestInit,
  effect?: ApostleEffect,
  transformer?: ApostleTransformer,
  interceptor?: ApostleInterceptor,
  config?: ApostleConfiguration
}

export class Apostle {
  private baseURL?: string
  private init: RequestInit
  private effect: ApostleEffect
  private transformer: ApostleTransformer
  private interceptor: ApostleInterceptor
  private config: ApostleConfiguration = {
    responseType: 'raw',
    inferRequestBodyContentType: false,
    inferResponseBodyContentType: false,
  }
  private ianaMediaTypeMethodMap?: Record<string, ApostleResponseType>

  constructor(options: ApostleConstructorOptions) {
    this.baseURL = options.baseURL
    this.init = options.init ?? {}
    this.effect = options.effect ?? {onSuccess: async () => {}, onError: async () => {}}
    this.transformer = options.transformer ?? {request: (body) => body, response: (body) => body}
    this.interceptor = options.interceptor ?? ((init) => init)
    if (options.config?.responseType) this.config.responseType = options.config.responseType
    if (options.config?.inferResponseBodyContentType) {
      this.ianaMediaTypeMethodMap = {
        "application/java-archive": "blob",
        "application/EDI-X12": "blob",
        "application/EDIFACT": "blob",
        "application/octet-stream": "blob",
        "application/ogg": "blob",
        "application/pdf": "blob", 
        "application/xhtml+xml": "text",
        "application/x-shockwave-flash": "blob",
        "application/json": "json",
        "application/ld+json": "json",
        "application/xml": "text",
        "application/zip": "blob",
        "application/x-www-form-urlencoded": "blob",
        "audio/mpeg": "blob",
        "audio/x-ms-wma": "blob",
        "audio/vnd.rn-realaudio": "blob",
        "audio/x-wav": "blob",
        "image/gif": "blob",   
        "image/jpeg": "blob",   
        "image/png": "blob",   
        "image/tiff": "blob",    
        "image/vnd.microsoft.icon": "blob",    
        "image/x-icon": "blob",   
        "image/vnd.djvu": "blob",   
        "image/svg+xml": "text",
        "multipart/mixed": "blob",
        "multipart/alternative": "blob",
        "multipart/related": "blob",
        "multipart/form-data": "blob",
        "text/css": "text",
        "text/csv": "text",
        "text/html": "text",
        "text/javascript": "text",
        "text/plain": "text",
        "text/xml": "text",
        "video/mpeg": "blob",
        "video/mp4": "blob",
        "video/quicktime": "blob",
        "video/x-ms-wmv": "blob",
        "video/x-msvideo": "blob",
        "video/x-flv": "blob",
        "video/webm": "blob",
        "application/vnd.android.package-archive": "blob",
        "application/vnd.oasis.opendocument.text": "blob",
        "application/vnd.oasis.opendocument.spreadsheet": "blob",
        "application/vnd.oasis.opendocument.presentation": "blob",
        "application/vnd.oasis.opendocument.graphics": "blob",
        "application/vnd.ms-excel": "blob",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "blob",
        "application/vnd.ms-powerpoint": "blob",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": "blob",
        "application/msword": "blob",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "blob",
        "application/vnd.mozilla.xul+xml": "blob",
      }
    }
  }

  public async dispatch(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    query?: Record<string, string | undefined>,
    body?: ApostleRequestBody,
    responseType: ApostleResponseType = this.config.responseType ?? 'raw',
    init: RequestInit = {},
  ) {
    try {
      if (query) Object.keys(query).forEach(key => {if (query[key] === undefined || query[key] === null) delete query[key]});
      const isBodyPlainObject = body && body.constructor === Object
      const inferredHeaders = new Headers()
      if (this.config.inferRequestBodyContentType) {
        if (isBodyPlainObject) inferredHeaders.set('Content-Type', 'application/json')
      }
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
      if (this.config.inferResponseBodyContentType) {
        const responseContentType = response.headers.get('Content-Type')
        if (responseContentType) responseType = this.ianaMediaTypeMethodMap![responseContentType] ?? responseType
      }
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