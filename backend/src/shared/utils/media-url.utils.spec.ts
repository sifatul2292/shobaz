import { normalizeMediaUrl, normalizeProductMedia } from './media-url.utils';

describe('media URL normalization', () => {
  it('repairs URLs created by the duplicated production protocol suffix', () => {
    expect(
      normalizeMediaUrl(
        'httpss://api.shobaz.com/api/upload/images/product.webp',
      ),
    ).toBe('https://api.shobaz.com/api/upload/images/product.webp');
  });

  it('leaves valid and unrelated URLs unchanged', () => {
    expect(normalizeMediaUrl('https://cdn.example.com/product.webp')).toBe(
      'https://cdn.example.com/product.webp',
    );
  });

  it('repairs product image arrays without mutating the source', () => {
    const product = {
      images: ['httpss://api.shobaz.com/api/upload/images/product.webp'],
      showcaseImages: ['https://cdn.example.com/showcase.webp'],
    };

    const normalized = normalizeProductMedia(product);

    expect(normalized.images[0]).toBe(
      'https://api.shobaz.com/api/upload/images/product.webp',
    );
    expect(product.images[0]).toBe(
      'httpss://api.shobaz.com/api/upload/images/product.webp',
    );
  });
});
