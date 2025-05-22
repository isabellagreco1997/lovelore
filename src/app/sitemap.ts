import { MetadataRoute } from 'next'

// Set your production URL
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lovelore.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // You can fetch dynamic routes like stories from your database
  // const stories = await fetchStories() // Implement this function to fetch from your DB
  
  // Static routes
  const staticRoutes = [
    '',
    '/stories',
    '/login',
    '/account',
    '/terms',
    '/privacy',
    '/contact',
    '/help',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Dynamic routes would go here
  // const dynamicRoutes = stories.map(story => ({
  //   url: `${baseUrl}/story/${story.id}`,
  //   lastModified: new Date(story.updatedAt),
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.7,
  // }))

  return [
    ...staticRoutes,
    // ...dynamicRoutes,
  ]
} 