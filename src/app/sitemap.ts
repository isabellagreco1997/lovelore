import { MetadataRoute } from 'next'

// Set your production URL
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lovelore.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Main priority pages that should appear as sitelinks
  const mainRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/stories`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9, // Very high priority for main content
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8, // High priority for user access
    },
  ]

  // Secondary important pages
  const secondaryRoutes = [
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ]

  // Lower priority pages (including authenticated pages with low priority)
  const lowerPriorityRoutes = [
    {
      url: `${baseUrl}/account`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3, // Low priority since it's behind auth
    },
  ]

  // Legal/footer pages (lower priority)
  const legalRoutes = [
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
  ]

  // Dynamic story routes would go here when you fetch them
  // const stories = await fetchStories() // Implement this function to fetch from your DB
  // const dynamicRoutes = stories.map(story => ({
  //   url: `${baseUrl}/story/${story.id}`,
  //   lastModified: new Date(story.updatedAt),
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.7,
  // }))

  return [
    ...mainRoutes,
    ...secondaryRoutes,
    ...lowerPriorityRoutes,
    ...legalRoutes,
    // ...dynamicRoutes,
  ]
} 