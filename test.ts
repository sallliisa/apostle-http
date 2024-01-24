import { Apostle } from "./src";

export const api = new Apostle(
    'asd',
    {
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'app/json'
      }
    },
    {
      onSuccess: async () => {},
      onError: async (error) => {
        if (error instanceof Error) error = error.message
        else if (error instanceof Response) error = (await error.json()).message || error.statusText
      }
    },
    {
      request: (body) => {
        if (body)
          for (const key of Object.keys(body))
            if (typeof body[key] === 'boolean') body[key] = body[key] ? 'Y' : 'N'
        return body
      },
      response: (body) => body
    },
    (init) => {
      const token = 'asd'
      if (token && init.headers) (init.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
      return init
    }
  )