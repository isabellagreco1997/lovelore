import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const storyId = searchParams.get('storyId');
  const worldId = searchParams.get('worldId');
  
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }
  
  try {
    const supabase = supabaseAdmin();
    
    // If we have storyId, find the corresponding world
    let actualWorldId = worldId;
    let storyInfo = null;
    
    if (storyId) {
      // Get story info
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('id, world_name, description')
        .eq('id', storyId)
        .single();
      
      if (storyError) {
        return NextResponse.json({ error: `Story error: ${storyError.message}` }, { status: 500 });
      }
      
      storyInfo = story;
      
      // Get the world that references this story
      const { data: world, error: worldError } = await supabase
        .from('worlds')
        .select('id, name, story_id')
        .eq('story_id', storyId)
        .single();
      
      if (worldError) {
        return NextResponse.json({ error: `World error: ${worldError.message}` }, { status: 500 });
      }
      
      actualWorldId = world.id;
    }
    
    if (!actualWorldId) {
      return NextResponse.json({ error: 'No worldId found' }, { status: 400 });
    }
    
    // Get all progress for this user and world
    const { data: progress, error: progressError } = await supabase
      .from('user_chapter_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('world_id', actualWorldId)
      .order('chapter_id');
    
    if (progressError) {
      return NextResponse.json({ error: progressError.message }, { status: 500 });
    }
    
    // Get all conversations for this user and world to see which chapters have been started
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('chapter_id, created_at, world_id')
      .eq('user_id', userId)
      .eq('world_id', actualWorldId)
      .order('chapter_id');
    
    if (convError) {
      return NextResponse.json({ error: convError.message }, { status: 500 });
    }
    
    // Get world info
    const { data: world, error: worldError } = await supabase
      .from('worlds')
      .select('*')
      .eq('id', actualWorldId)
      .single();
    
    return NextResponse.json({
      storyInfo,
      worldInfo: world,
      actualWorldId,
      progress: progress || [],
      conversations: conversations || [],
      debug: {
        requestParams: { userId, storyId, worldId },
        progressCount: progress?.length || 0,
        conversationCount: conversations?.length || 0,
        progressIds: progress?.map(p => ({
          chapterId: p.chapter_id,
          chapterIdType: typeof p.chapter_id,
          isCompleted: p.is_completed,
          completedType: typeof p.is_completed,
          worldId: p.world_id
        })) || [],
        conversationWorldIds: conversations?.map(c => ({
          chapterId: c.chapter_id,
          worldId: c.world_id
        })) || []
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, worldId, action, chapterId } = await request.json();
    
    if (!userId || !worldId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const supabase = supabaseAdmin();
    
    if (action === 'fix_types') {
      // Fix any type inconsistencies in the database
      const { data: progress, error: fetchError } = await supabase
        .from('user_chapter_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('world_id', worldId);
      
      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
      }
      
      let fixed = 0;
      for (const record of progress || []) {
        // Ensure chapter_id is a string and is_completed is a boolean
        const updates: any = {};
        
        if (typeof record.chapter_id !== 'string') {
          updates.chapter_id = String(record.chapter_id);
        }
        
        if (typeof record.is_completed !== 'boolean') {
          updates.is_completed = Boolean(record.is_completed);
        }
        
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('user_chapter_progress')
            .update(updates)
            .eq('id', record.id);
          
          if (!updateError) {
            fixed++;
          }
        }
      }
      
      return NextResponse.json({ 
        message: `Fixed ${fixed} records`,
        totalRecords: progress?.length || 0
      });
    }
    
    if (action === 'mark_completed' && chapterId) {
      // Manually mark a chapter as completed
      const chapterIdStr = String(chapterId);
      
      const { data: existing, error: queryError } = await supabase
        .from('user_chapter_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('world_id', worldId)
        .eq('chapter_id', chapterIdStr)
        .maybeSingle();
      
      if (queryError) {
        return NextResponse.json({ error: queryError.message }, { status: 500 });
      }
      
      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('user_chapter_progress')
          .update({ 
            is_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
        
        return NextResponse.json({ message: `Chapter ${chapterId} marked as completed (updated)` });
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('user_chapter_progress')
          .insert({
            user_id: userId,
            world_id: worldId,
            chapter_id: chapterIdStr,
            is_completed: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
        
        return NextResponse.json({ message: `Chapter ${chapterId} marked as completed (created)` });
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 