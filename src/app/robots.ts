import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/account/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lovelore.app'}/sitemap.xml`,
  }
} 