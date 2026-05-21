import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductService } from '../product/product.service';

@Injectable()
export class FbFeedService {
  private readonly siteUrl = 'https://shobaz.com';

  constructor(
    private readonly productService: ProductService,
    private readonly configService: ConfigService,
  ) {}

  async generateFeedXml(): Promise<string> {
    const products = await this.productService.findAllForFbFeed();

    const items = products.map((p) => {
      const id = String(p._id);
      const title = this.escapeXml(p.nameEn || p.name || '');
      const description = this.escapeXml(
        p.shortDescription || p.description || p.name || '',
      ).slice(0, 5000);
      const link = `${this.siteUrl}/product-details/${p.slug}`;
      const imageLink =
        p.images && p.images.length
          ? p.images[0]
          : 'https://cdn.saleecom.com/upload/images/placeholder.png';
      const availability = p.quantity > 0 ? 'in stock' : 'out of stock';
      const price = `${Number(p.salePrice || 0).toFixed(2)} BDT`;
      const brandName = p.brand?.name ? this.escapeXml(p.brand.name) : 'Shobaz';
      const categoryName = p.category?.name ? this.escapeXml(p.category.name) : '';

      const additionalImages =
        p.images && p.images.length > 1
          ? p.images
              .slice(1, 10)
              .map((img: string) => `<g:additional_image_link>${img}</g:additional_image_link>`)
              .join('\n      ')
          : '';

      return `    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      ${additionalImages}
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:condition>new</g:condition>
      <g:brand>${brandName}</g:brand>
      ${categoryName ? `<g:product_type>${categoryName}</g:product_type>` : ''}
    </item>`;
    });

    return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Shobaz</title>
    <link>${this.siteUrl}</link>
    <description>Shobaz product catalog for Facebook</description>
${items.join('\n')}
  </channel>
</rss>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
