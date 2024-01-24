/**
 * @typedef {Function} ApostleSuccessEffectFunction
 * @param {Response} response - The request's response
 * @returns {Promise<void>}
 */

/**
 * @typedef {Function} ApostleErrorEffectFunction
 * @param {Unknown} error - The request's error response
 * @returns {Promise<void>}
 */

/**
 * @typedef {Object} ApostleEffect
 * @property {ApostleSuccessEffectFunction} onSuccess - Effect executed on successful request
 * @property {ApostleErrorEffectFunction} onError - Effect executed on failed request
 */

/**
 * @typedef {Function} ApostleTransformerFunction
 * @param {Record<string, any>} body - Request's body
 * @returns {Record<string, any>}
 */

/**
 * @typedef {Object} ApostleTransformer
 * @property {ApostleTransformerFunction} request - Request transformer
 * @property {ApostleTransformerFunction} response - Response transformer
 */

/**
 * @typedef {Function} ApostleInterceptor
 * @param {RequestInit} init - Request's init object
 * @returns {RequestInit}
 */

export class Apostle {
  /**
   * Instantiate an Apostle class
   * @param {string} baseURL - The Base URL path
   * @param {RequestInit} init - RequestInit,
   * @param {ApostleEffect} effect - Effect executed on request success and failure
   * @param {ApostleTransformer} transformer - Request and response body transformer
   * @param {ApostleInterceptor} interceptor - Request's init interceptor
   */
  constructor(
    baseURL,
    init = {},
    effect = {onSuccess: async () => {}, onError: async () => {}},
    transformer = {request: (body) => body, response: (body) => body},
    interceptor = (init) => init
  ) {
    this.baseURL = baseURL
    this.init = init
    this.effect = effect
    this.transformer = transformer
    this.interceptor = interceptor
  }

  /**
   * Dispatch an HTTP request. Used as a base for all methods in Apostle.
   * @param {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'} method - Request HTTP method
   * @param {string} path - Request URL path
   * @param {Record<string, string | undefined>} query - Request's query parameters
   * @param {Record<string, any> | string | FormData | URLSearchParams} body 
   * @param {RequestInit} init 
   * @returns {Promise<Record<string, any>>}
   */
  async dispatch(method, path, query = undefined, body = undefined, init = {}) {
    try {
      const combinedInit = {...this.init, ...init}
      const inferredInit = {}
      const isBodyPlainObject = body && body.constructor === Object
      if (isBodyPlainObject) (inferredInit.headers ??= {})['Content-Type'] = 'application/json'
      if (query) Object.keys(query).forEach(key => (query[key] === undefined || query[key] === null) ? delete query[key] : {});
      const response = await fetch(
        `${this.baseURL}/${path}?${new URLSearchParams(query)}`,
        {
          ...this.interceptor({...inferredInit, ...combinedInit}),
          headers: {...inferredInit.headers, ...combinedInit.headers},
          body: isBodyPlainObject ? JSON.stringify(this.transformer.request(body)) : body,
          method
        }
      )
      if (!response.ok) throw response
      await this.effect.onSuccess(response)
      return this.transformer.response(await response.json())
    } catch (response) {
      throw await this.effect.onError(response)
    }
  }

  /**
   * Dispatch a GET request
   * @param {string | {path: string, query: Record<string, string | undefined>}} path - URL Path
   * @param {RequestInit} init - Request's init
   * @returns {Promise<Record<string, any>>}
   */
  async get(path, init = undefined) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch('GET', pathObject.path, pathObject.query, undefined, init)
    } catch (error) {
      throw error
    }
  }

  /**
   * Dispatch a POST request
   * @param {string | {path: string, query: Record<string, string | undefined>}} path - URL Path
   * @param {Record<string, any> | string | FormData | URLSearchParams} body - Request's body
   * @param {RequestInit} init - Request's init
   * @returns {Promise<Record<string, any>>}
   */
  async post(path, body = undefined, init = undefined) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch('POST', pathObject.path, pathObject.query, body, init)
    } catch (error) {
      throw error
    }
  }

  /**
   * Dispatch a PUT request
   * @param {string | {path: string, query: Record<string, string | undefined>}} path - URL Path
   * @param {Record<string, any> | string | FormData | URLSearchParams} body - Request's body
   * @param {RequestInit} init - Request's init
   * @returns {Promise<Record<string, any>>}
   */
  async put(path, body = undefined, init = undefined) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch('PUT', pathObject.path, pathObject.query, body, init)
    } catch (error) {
      throw error
    }
  }

  /**
   * Dispatch a PATCH request
   * @param {string | {path: string, query: Record<string, string | undefined>}} path - URL Path
   * @param {Record<string, any> | string | FormData | URLSearchParams} body - Request's body
   * @param {RequestInit} init - Request's init
   * @returns {Promise<Record<string, any>>}
   */
  async patch(path, body = undefined, init = undefined) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch('PATCH', pathObject.path, pathObject.query, body, init)
    } catch (error) {
      throw error
    }
  }

  /**
   * Dispatch a DELETE request
   * @param {string | {path: string, query: Record<string, string | undefined>}} path - URL Path
   * @param {Record<string, any> | string | FormData | URLSearchParams} body - Request's body
   * @param {RequestInit} init - Request's init
   * @returns {Promise<Record<string, any>>}
   */
  async delete(path, body = undefined, init = undefined) {
    try {
      const pathObject = typeof path === 'string' ? {path} : path
      return await this.dispatch('DELETE', pathObject.path, pathObject.query, body, init)
    } catch (error) {
      throw error
    }
  }
}