import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { api, fieldErrors } from '@/services/api'

// We import api once at module level so the etagCache is shared across tests in this file.
// Tests that need a clean cache state must use a URL not used by other tests.

describe('api service', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // ── Basic shape ──────────────────────────────────────────────────────────────

  it('exposes baseURL from env', () => {
    expect(api.defaults.baseURL).toBeDefined()
    expect(typeof api.defaults.baseURL).toBe('string')
  })

  it('has request and response interceptors registered', () => {
    // @ts-expect-error - accessing internal axios interceptor manager
    expect(api.interceptors.request.handlers.length).toBeGreaterThan(0)
    // @ts-expect-error - accessing internal axios interceptor manager
    expect(api.interceptors.response.handlers.length).toBeGreaterThan(0)
  })

  // ── fieldErrors ──────────────────────────────────────────────────────────────

  it('fieldErrors returns empty object for non-axios errors', () => {
    expect(fieldErrors(new Error('plain'))).toEqual({})
    expect(fieldErrors('string error')).toEqual({})
    expect(fieldErrors(null)).toEqual({})
  })

  it('fieldErrors extracts errors from axios errors', () => {
    const axiosErr = new axios.AxiosError(
      'Unprocessable Entity',
      '422',
      undefined,
      undefined,
      {
        status: 422,
        data: { message: 'Validation failed', errors: { foo: ['bar', 'baz'], date: ['required'] } },
        statusText: 'Unprocessable Entity',
        headers: {},
        config: {} as never,
      },
    )
    expect(fieldErrors(axiosErr)).toEqual({ foo: ['bar', 'baz'], date: ['required'] })
  })

  it('fieldErrors returns empty object when axios error has no errors field', () => {
    const axiosErr = new axios.AxiosError(
      'Server Error',
      '500',
      undefined,
      undefined,
      {
        status: 500,
        data: { message: 'Internal Server Error' },
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as never,
      },
    )
    expect(fieldErrors(axiosErr)).toEqual({})
  })

  // ── Interceptors (driven directly via internal handlers) ─────────────────────

  function getRequestHandler() {
    // @ts-expect-error - accessing internal axios interceptor manager
    return api.interceptors.request.handlers.at(-1) as { fulfilled: (cfg: unknown) => unknown }
  }

  function getResponseHandlers() {
    // @ts-expect-error - accessing internal axios interceptor manager
    return api.interceptors.response.handlers.at(-1) as {
      fulfilled: (res: unknown) => unknown
      rejected: (err: unknown) => unknown
    }
  }

  it('request interceptor passes through non-GET requests unchanged', () => {
    const handler = getRequestHandler()
    const cfg = { method: 'post', url: '/time-entries', headers: { set: vi.fn() } }
    const result = handler.fulfilled(cfg)
    expect(result).toBe(cfg)
    expect(cfg.headers.set).not.toHaveBeenCalled()
  })

  it('request interceptor sets If-None-Match when cache has entry for the URL', () => {
    // First populate the cache by running the response success handler
    const responseHandler = getResponseHandlers()
    const url = '/companies-etag-test'
    responseHandler.fulfilled({
      config: { method: 'get', url },
      headers: { etag: '"etag-xyz"' },
      data: { data: [] },
      status: 200,
      statusText: 'OK',
    })

    // Now run the request handler for the same URL
    const requestHandler = getRequestHandler()
    const setMock = vi.fn()
    const cfg = { method: 'get', url, headers: { set: setMock } }
    requestHandler.fulfilled(cfg)

    expect(setMock).toHaveBeenCalledWith('If-None-Match', '"etag-xyz"')
  })

  it('request interceptor does not set header when URL has no cache entry', () => {
    const handler = getRequestHandler()
    const setMock = vi.fn()
    const cfg = { method: 'get', url: '/no-cache-here', headers: { set: setMock } }
    handler.fulfilled(cfg)
    expect(setMock).not.toHaveBeenCalled()
  })

  it('response success handler stores etag in cache', () => {
    const { fulfilled } = getResponseHandlers()
    const url = '/companies-store-test'
    const fakeData = { data: [{ id: '1', name: 'Acme' }] }
    fulfilled({
      config: { method: 'get', url },
      headers: { etag: '"etag-store"' },
      data: fakeData,
      status: 200,
      statusText: 'OK',
    })

    // Verify by trying a request — it should set If-None-Match
    const setMock = vi.fn()
    getRequestHandler().fulfilled({ method: 'get', url, headers: { set: setMock } })
    expect(setMock).toHaveBeenCalledWith('If-None-Match', '"etag-store"')
  })

  it('304 error handler replays cached body when cache entry exists', async () => {
    const { fulfilled, rejected } = getResponseHandlers()
    const url = '/companies-304-test'
    const cachedData = { data: [{ id: '42', name: 'Cached Co' }] }

    // Populate cache
    fulfilled({
      config: { method: 'get', url },
      headers: { etag: '"etag-304"' },
      data: cachedData,
      status: 200,
      statusText: 'OK',
    })

    // Simulate 304 error
    const result = await rejected({ response: { status: 304 }, config: { url } })
    expect((result as { status: number }).status).toBe(200)
    expect((result as { data: unknown }).data).toEqual(cachedData)
  })

  it('304 error handler rejects when no cache entry exists', async () => {
    const { rejected } = getResponseHandlers()
    const err = { response: { status: 304 }, config: { url: '/not-in-cache-ever' } }
    await expect(rejected(err)).rejects.toBe(err)
  })

  it('error handler rejects non-304 errors', async () => {
    const { rejected } = getResponseHandlers()
    const err = { response: { status: 500 }, config: { url: '/server-error' } }
    await expect(rejected(err)).rejects.toBe(err)
  })

  it('request interceptor defaults method to GET when method is undefined', () => {
    // Tests the `cfg.method ?? 'get'` null-coalescing branch
    const handler = getRequestHandler()
    const setMock = vi.fn()
    // No method field — should still treat as GET
    const cfg = { url: '/no-method-url', headers: { set: setMock } }
    handler.fulfilled(cfg)
    // No cache entry for this URL, so header not set — but no crash
    expect(setMock).not.toHaveBeenCalled()
  })

  it('response success handler defaults method to GET when method is undefined', () => {
    // Tests the `res.config.method ?? 'get'` null-coalescing branch
    const { fulfilled } = getResponseHandlers()
    const url = '/no-method-response'
    // No method in config — should still cache if etag present
    const res = fulfilled({
      config: { url }, // no method
      headers: { etag: '"etag-no-method"' },
      data: { data: [] },
      status: 200,
      statusText: 'OK',
    })
    expect(res).toBeDefined()
    // Verify it cached by checking the request sets the header
    const setMock = vi.fn()
    getRequestHandler().fulfilled({ url, headers: { set: setMock } })
    expect(setMock).toHaveBeenCalledWith('If-None-Match', '"etag-no-method"')
  })

  it('response success handler does not cache when url is missing', () => {
    // Tests the `res.config.url` falsy branch
    const { fulfilled } = getResponseHandlers()
    const res = fulfilled({
      config: { method: 'get' }, // no url
      headers: { etag: '"etag-no-url"' },
      data: { data: [] },
      status: 200,
      statusText: 'OK',
    })
    expect(res).toBeDefined()
  })

  it('error handler rejects when config has no url', async () => {
    const { rejected } = getResponseHandlers()
    const err = { response: { status: 304 }, config: {} } // no url
    await expect(rejected(err)).rejects.toBe(err)
  })

  it('response success handler does not cache when response has no etag', () => {
    // Tests the `if (etag)` false branch in the success handler
    const { fulfilled } = getResponseHandlers()
    const url = '/no-etag-response'
    fulfilled({
      config: { method: 'get', url },
      headers: {}, // no etag header
      data: { data: [] },
      status: 200,
      statusText: 'OK',
    })
    // Verify nothing was cached — request interceptor should not set If-None-Match
    const setMock = vi.fn()
    getRequestHandler().fulfilled({ method: 'get', url, headers: { set: setMock } })
    expect(setMock).not.toHaveBeenCalled()
  })
})
