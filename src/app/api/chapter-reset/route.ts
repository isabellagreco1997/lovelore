import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { worldId, userId, chapterId } = await request.json();
    
    if (!worldId || !userId || !chapterId) {
      return NextResponse.json({ error: 'World ID, User ID, and Chapter ID are required' }, { status: 400 });
    }
    
    console.log('Resetting chapter with params:', { worldId, userId, chapterId });
    
    // Initialize Supabase client
    const supabase = supabaseAdmin();
    
    // Delete chapter progress for this specific chapter
    const { error: progressError } = await supabase
      .from('user_chapter_progress')
      .delete()
      .eq('user_id', userId)
      .eq('world_id', worldId)
      .eq('chapter_id', chapterId);
      
    if (progressError) {
      return NextResponse.json({ error: 'Failed to delete chapter progress' }, { status: 500 });
    }
    
    // Find all conversations for this chapter
    const { data: conversations, error: conversationsQueryError } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('world_id', worldId)
      .eq('chapter_id', chapterId);
      
    if (conversationsQueryError) {
      return NextResponse.json({ error: 'Failed to query conversations' }, { status: 500 });
    }
    
    // Delete all messages from these conversations
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(convo => convo.id);
      
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .in('conversation_id', conversationIds);
        
      if (messagesError) {
        return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 });
      }
    }
    
    // Delete all conversations related to this chapter
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .eq('user_id', userId)
      .eq('world_id', worldId)
      .eq('chapter_id', chapterId);
      
    if (conversationsError) {
      return NextResponse.json({ error: 'Failed to delete conversations' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Chapter progress and conversations reset successfully' 
    });
  } catch (error: any) {
    console.error('Error in chapter reset:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
} 