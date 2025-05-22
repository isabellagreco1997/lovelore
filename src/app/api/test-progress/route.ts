import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin();
    
    // Get all stories
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('id, world_name')
      .limit(5);
    
    if (storiesError) {
      return NextResponse.json({ error: storiesError.message }, { status: 500 });
    }
    
    // Get all worlds with their story relationships
    const { data: worlds, error: worldsError } = await supabase
      .from('worlds')
      .select('id, name, story_id, user_id')
      .limit(10);
    
    if (worldsError) {
      return NextResponse.json({ error: worldsError.message }, { status: 500 });
    }
    
    // Get all progress records
    const { data: progress, error: progressError } = await supabase
      .from('user_chapter_progress')
      .select('*')
      .limit(10);
    
    if (progressError) {
      return NextResponse.json({ error: progressError.message }, { status: 500 });
    }
    
    // Get all conversations to see which worlds are being used
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('world_id, user_id, chapter_id')
      .limit(10);
    
    if (conversationsError) {
      return NextResponse.json({ error: conversationsError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'Supabase connection working!',
      data: {
        storiesCount: stories?.length || 0,
        worldsCount: worlds?.length || 0,
        progressCount: progress?.length || 0,
        conversationsCount: conversations?.length || 0,
        sampleStories: stories?.slice(0, 3) || [],
        allWorlds: worlds || [],
        sampleProgress: progress?.slice(0, 5) || [],
        sampleConversations: conversations?.slice(0, 5) || []
      },
      relationships: {
        worldsPerStory: worlds?.reduce((acc: any, world: any) => {
          const storyId = world.story_id;
          if (!acc[storyId]) acc[storyId] = [];
          acc[storyId].push(world);
          return acc;
        }, {}) || {}
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 