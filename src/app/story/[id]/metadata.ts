import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getStory(id: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials are missing');
    return null;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('world_name, description, image, genre')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching story:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Error in getStory:', err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Get story data
  const story = await getStory(params.id);
  
  if (!story) {
    return {
      title: 'Story Not Found - LoveLore',
      description: 'The requested story could not be found.',
    };
  }
  
  // Generate SEO-friendly metadata
  const title = `${story.world_name} - LoveLore Interactive Story`;
  const description = story.description || 'Immerse yourself in an interactive romance story with AI-powered narratives that respond to your choices.';
  
  // Generate keywords based on story data
  const keywords = [
    'interactive stories', 
    'romance stories', 
    'AI storytelling', 
    'choose your own adventure', 
    'narrative games', 
    story.world_name, 
    story.genre || 'romance'
  ].filter(Boolean).join(', ');
  
  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lovelore.app'}/story/${params.id}`,
      siteName: 'LoveLore',
      images: [
        {
          url: story.image || '/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: story.world_name,
        },
      ],
      locale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [story.image || '/images/og-image.jpg'],
    },
  };
} 