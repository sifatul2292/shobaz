export const normalizeMediaUrl = (url: string): string => {
  return typeof url === 'string'
    ? url.replace(/^httpss:\/\//i, 'https://')
    : url;
};

export const normalizeMediaUrls = (urls: string[]): string[] => {
  return Array.isArray(urls) ? urls.map(normalizeMediaUrl) : urls;
};

export const normalizeProductMedia = <T>(product: T): T => {
  if (!product || typeof product !== 'object') {
    return product;
  }

  const source: any = product as any;
  const data =
    typeof source.toObject === 'function' ? source.toObject() : source;

  return {
    ...data,
    ...(Array.isArray(data.images)
      ? { images: normalizeMediaUrls(data.images) }
      : {}),
    ...(Array.isArray(data.showcaseImages)
      ? { showcaseImages: normalizeMediaUrls(data.showcaseImages) }
      : {}),
  } as T;
};
