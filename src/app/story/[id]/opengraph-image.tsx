import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

async function getStory(id: string) {
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('world_name, description, image')
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

export default async function Image({ params }: { params: { id: string } }) {
  const story = await getStory(params.id);
  
  if (!story) {
    // Fallback image if story not found
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            background: 'linear-gradient(to bottom, #1E293B, #0F172A)',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
          }}
        >
          <div
            style={{
              fontSize: 60,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            LoveLore Interactive Story
          </div>
          <div style={{ fontSize: 30, color: '#E2E8F0', textAlign: 'center' }}>
            Immerse yourself in interactive romance stories
          </div>
        </div>
      ),
      size
    );
  }
  
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          background: 'linear-gradient(to bottom, #1E293B, #0F172A)',
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background image with overlay */}
        {story.image && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${story.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.5)',
              zIndex: 0,
            }}
          />
        )}
        
        {/* Content container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '60px',
            width: '100%',
            zIndex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
        >
          <div
            style={{
              fontSize: 24,
              color: '#E2E8F0',
              marginBottom: 10,
            }}
          >
            LoveLore Interactive Story
          </div>
          <div
            style={{
              fontSize: 60,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: 20,
            }}
          >
            {story.world_name || 'Interactive Story'}
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#E2E8F0',
              lineHeight: 1.4,
            }}
          >
            {story.description?.substring(0, 120) || 'Immerse yourself in interactive romance stories with AI-powered narratives'}
            {story.description?.length > 120 ? '...' : ''}
          </div>
        </div>
      </div>
    ),
    size
  );
} 