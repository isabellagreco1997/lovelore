import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lovelore.app'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/stories',
          '/help',
          '/contact',
          '/terms',
          '/privacy',
          '/login',
          '/story/*', // Allow story pages
        ],
        disallow: [
          '/api/*',
          '/account/*', // Keep account pages private
          '/debug/*',
          '/test-*',
          '/_next/*',
          '/admin/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/stories',
          '/help',
          '/contact',
          '/terms',
          '/privacy',
          '/login',
          '/story/*',
        ],
        disallow: [
          '/api/*',
          '/account/*',
          '/debug/*',
          '/test-*',
        ],
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
} 