import { getApiBaseUrl } from './file-upload.utils';

const request = (
  protocol: string,
  headers: Record<string, string> = {},
): any => ({
  protocol,
  get: (name: string) => headers[name.toLowerCase()],
});

describe('getApiBaseUrl', () => {
  it('does not append another s when the trusted proxy reports HTTPS', () => {
    const req = request('https', {
      host: 'api.shobaz.com',
      'x-forwarded-proto': 'https',
    });

    expect(getApiBaseUrl(req, true)).toBe('https://api.shobaz.com/api');
  });

  it('upgrades a production HTTP request to HTTPS', () => {
    const req = request('http', { host: 'api.shobaz.com' });

    expect(getApiBaseUrl(req, true)).toBe('https://api.shobaz.com/api');
  });

  it('keeps HTTP for local development', () => {
    const req = request('http', { host: 'localhost:4000' });

    expect(getApiBaseUrl(req, false)).toBe('http://localhost:4000/api');
  });

  it('uses the first forwarded protocol and host values', () => {
    const req = request('http', {
      host: 'internal:4000',
      'x-forwarded-proto': 'https, http',
      'x-forwarded-host': 'api.shobaz.com, internal:4000',
    });

    expect(getApiBaseUrl(req, true)).toBe('https://api.shobaz.com/api');
  });
});
