import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { storyId, userId } = await request.json();
    
    if (!storyId || !userId) {
      return NextResponse.json({ error: 'Story ID and User ID are required' }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabase = supabaseAdmin();
    
    // Get the world ID associated with this story
    const { data: worldData, error: worldError } = await supabase
      .from('worlds')
      .select('id')
      .eq('story_id', storyId)
      .single();
      
    if (worldError) {
      return NextResponse.json({ error: 'Failed to find world for this story' }, { status: 404 });
    }
    
    // Delete all chapter progress for this user and world
    const { error: progressError } = await supabase
      .from('user_chapter_progress')
      .delete()
      .eq('user_id', userId)
      .eq('world_id', worldData.id);
      
    if (progressError) {
      return NextResponse.json({ error: 'Failed to delete chapter progress' }, { status: 500 });
    }
    
    // Delete all conversations related to this story
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .eq('user_id', userId)
      .eq('world_id', worldData.id);
      
    if (conversationsError) {
      return NextResponse.json({ error: 'Failed to delete conversations' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting story:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 