"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import useSupabase from '@/hooks/useSupabase';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  customBreadcrumbs?: BreadcrumbItem[];
}

const Breadcrumbs = ({ customBreadcrumbs }: BreadcrumbsProps) => {
  const pathname = usePathname();
  const supabase = useSupabase();
  const [storyNames, setStoryNames] = useState<Record<string, string>>({});

  // Don't show breadcrumbs on home page
  if (pathname === '/') return null;

  // Fetch story names for story pages
  useEffect(() => {
    if (!supabase) return;

    const fetchStoryNames = async () => {
      const pathSegments = pathname.split('/').filter(Boolean);
      const storyIds: string[] = [];

      // Find story IDs in the path
      pathSegments.forEach((segment, index) => {
        if (pathSegments[index - 1] === 'story') {
          storyIds.push(segment);
        }
      });

      if (storyIds.length > 0) {
        try {
          const { data, error } = await supabase
            .from('stories')
            .select('id, world_name')
            .in('id', storyIds);

          if (error) {
            console.error('Error fetching story names:', error);
            return;
          }

          const nameMap: Record<string, string> = {};
          data.forEach(story => {
            nameMap[story.id] = story.world_name;
          });
          setStoryNames(nameMap);
        } catch (error) {
          console.error('Error fetching story names:', error);
        }
      }
    };

    fetchStoryNames();
  }, [pathname, supabase]);

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customBreadcrumbs) return customBreadcrumbs;

    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Map segments to readable labels
      let label = segment;
      let href = currentPath;
      
      switch (segment) {
        case 'stories':
          label = 'Stories';
          break;
        case 'story':
          label = 'Story';
          // Link to stories list instead of non-existent /story page
          href = '/stories';
          break;
        case 'chapter':
          label = 'Chapter';
          // For chapter breadcrumb, link back to the story page
          const storyId = pathSegments[index - 1];
          href = `/story/${storyId}`;
          break;
        case 'account':
          label = 'Account';
          break;
        case 'login':
          label = 'Sign In';
          break;
        case 'contact':
          label = 'Contact';
          break;
        case 'help':
          label = 'Help';
          break;
        case 'terms':
          label = 'Terms of Service';
          break;
        case 'privacy':
          label = 'Privacy Policy';
          break;
        default:
          // Check if this is a story ID and we have the story name
          if (pathSegments[index - 1] === 'story' && storyNames[segment]) {
            label = storyNames[segment];
          } else if (pathSegments[index - 1] === 'chapter') {
            // For chapter IDs, show as "Chapter X"
            const chapterNumber = parseInt(segment);
            if (!isNaN(chapterNumber)) {
              label = `Chapter ${chapterNumber + 1}`;
            } else {
              label = `Chapter ${segment}`;
            }
          } else {
            // For dynamic segments like IDs, try to make them more readable
            if (segment.length > 10 && segment.includes('-')) {
              label = segment.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
            } else {
              label = segment.charAt(0).toUpperCase() + segment.slice(1);
            }
          }
      }

      breadcrumbs.push({
        label,
        href
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Generate JSON-LD structured data for breadcrumbs
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lovelore.app'}${crumb.href}`
    }))
  };

  return (
    <>
      {/* Structured data for breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      
      {/* Visual breadcrumbs */}
      <nav 
        className="flex items-center space-x-2 text-sm text-gray-400 mb-6 px-4 sm:px-6 lg:px-8"
        aria-label="Breadcrumb"
      >
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />
            )}
            {index === breadcrumbs.length - 1 ? (
              // Current page - not a link
              <span className="text-white font-medium flex items-center">
                {index === 0 && <Home className="w-4 h-4 mr-1" />}
                {crumb.label}
              </span>
            ) : (
              // Previous pages - links
              <Link 
                href={crumb.href}
                className="hover:text-white transition-colors duration-200 flex items-center"
              >
                {index === 0 && <Home className="w-4 h-4 mr-1" />}
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </>
  );
};

export default Breadcrumbs; 