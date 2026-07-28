import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

describe('AI Assist authentication recovery', () => {
  it('preserves the draft and resumes after an expired admin session', async () => {
    const dom = new JSDOM(
      '<!doctype html><html><head></head><body><div class="topbar-right"><a class="btn-add" href="#">Add order</a></div></body></html>',
      {
        runScripts: 'outside-only',
        url: 'http://localhost:4000/upload/static/custom-orders.html',
      },
    );
    const window = dom.window as any;
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../../upload/static/ai-assist-widget.js'),
      'utf8',
    );
    const fetchMock = jest.fn((url: string) => {
      if (url.includes('/api/product/get-all')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [{ _id: 'product-id', name: 'Test book', salePrice: 450 }],
            }),
        });
      }
      if (url.includes('/api/order/add-assisted')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })),
        });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    window.fetch = fetchMock;
    window.localStorage.setItem('co_admin_token', 'expired-token');
    window.eval(source);
    window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

    window.document.getElementById('shobaz-ai-assist-button').click();
    window.document.getElementById('sa-phone').value = '01712345678';
    window.document.getElementById('sa-name').value = 'Saved customer';
    window.document.getElementById('sa-address').value = 'Saved address';
    window.document.getElementById('sa-product-search').value = 'Test book';
    window.document.getElementById('sa-search-button').click();
    await new Promise((resolve) => setImmediate(resolve));
    window.document.querySelector('.sa-result').click();

    let authRequestCount = 0;
    window.addEventListener('shobaz:admin-auth-required', () => {
      authRequestCount += 1;
    });
    window.document.getElementById('sa-create').click();
    await new Promise((resolve) => setImmediate(resolve));

    const overlay = window.document.getElementById('shobaz-ai-assist-overlay');
    expect(authRequestCount).toBe(1);
    expect(overlay.classList.contains('open')).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    window.dispatchEvent(new window.CustomEvent('shobaz:admin-auth-restored'));

    expect(overlay.classList.contains('open')).toBe(true);
    expect(window.document.getElementById('sa-name').value).toBe(
      'Saved customer',
    );
    expect(window.document.querySelector('.sa-selected-name').textContent).toBe(
      'Test book',
    );
    expect(window.document.getElementById('sa-create-status').textContent).toContain(
      'Click Create order again',
    );

    dom.window.close();
  });
});
