import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { storyId, userId } = await request.json();
    
    if (!storyId || !userId) {
      return NextResponse.json({ error: 'Story ID and User ID are required' }, { status: 400 });
    }
    
    console.log(`Starting complete reset process for story ${storyId} and user ${userId}`);
    
    // Initialize Supabase client with service role for admin operations
    const supabase = supabaseAdmin();
    
    // Get the world ID associated with this story
    const { data: worldData, error: worldError } = await supabase
      .from('worlds')
      .select('*')
      .eq('story_id', storyId)
      .single();
      
    if (worldError) {
      console.log(`World not found for story ${storyId}, nothing to reset`);
      return NextResponse.json({ error: 'World not found for this story', status: 404 });
    }
    
    const worldId = worldData.id;
    console.log(`Found world ${worldId} for story ${storyId}, proceeding with deletion`);
    
    // Track our deletion progress
    const results = {
      messages: { count: 0, success: false, error: null as string | null },
      conversations: { count: 0, success: false, error: null as string | null },
      progress: { count: 0, success: false, error: null as string | null },
      world: { success: false, error: null as string | null }
    };
    
    try {
      // STEP 1: Delete all messages first (child records of conversations)
      // First find all conversations for this world
      const { data: conversations, error: fetchConversationsError } = await supabase
        .from('conversations')
        .select('id')
        .eq('world_id', worldId);
        
      if (fetchConversationsError) {
        console.error(`Failed to fetch conversations:`, fetchConversationsError);
        results.conversations.error = fetchConversationsError.message;
        return NextResponse.json({ 
          error: 'Failed to fetch conversations',
          details: results
        }, { status: 500 });
      }
      
      console.log(`Found ${conversations?.length || 0} conversations to process`);
      results.conversations.count = conversations?.length || 0;
      
      // Delete all messages from these conversations
      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(convo => convo.id);
        
        // Check how many messages we need to delete
        const { count, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds);
          
        console.log(`Found ${count || 0} messages to delete`);
        results.messages.count = count || 0;
        
        // Delete messages in batches to avoid timeouts
        const BATCH_SIZE = 100;
        for (let i = 0; i < conversationIds.length; i += BATCH_SIZE) {
          const batchIds = conversationIds.slice(i, i + BATCH_SIZE);
          
          console.log(`Deleting messages for conversations batch ${i / BATCH_SIZE + 1}`);
          
          const { error: batchDeleteError } = await supabase
            .from('messages')
            .delete()
            .in('conversation_id', batchIds);
            
          if (batchDeleteError) {
            console.error(`Failed to delete messages batch:`, batchDeleteError);
            results.messages.error = batchDeleteError.message;
            return NextResponse.json({ 
              error: 'Failed to delete messages', 
              details: results 
            }, { status: 500 });
          }
        }
        
        console.log(`Successfully deleted all messages`);
        results.messages.success = true;
      } else {
        console.log(`No conversations found, no messages to delete`);
        results.messages.success = true;
      }
      
      // STEP 2: Delete all conversations
      console.log(`Deleting all conversations for world ${worldId}`);
      
      const { error: conversationsError } = await supabase
        .from('conversations')
        .delete()
        .eq('world_id', worldId);
        
      if (conversationsError) {
        console.error(`Failed to delete conversations:`, conversationsError);
        results.conversations.error = conversationsError.message;
        return NextResponse.json({ 
          error: 'Failed to delete conversations', 
          details: results 
        }, { status: 500 });
      }
      
      console.log(`Successfully deleted all conversations`);
      results.conversations.success = true;
      
      // STEP 3: Delete all chapter progress
      console.log(`Deleting all chapter progress for world ${worldId}`);
      
      // First check how many progress records we have
      const { count: progressCount, error: countProgressError } = await supabase
        .from('user_chapter_progress')
        .select('*', { count: 'exact', head: true })
        .eq('world_id', worldId);
        
      console.log(`Found ${progressCount || 0} progress records to delete`);
      results.progress.count = progressCount || 0;
      
      const { error: progressError } = await supabase
        .from('user_chapter_progress')
        .delete()
        .eq('world_id', worldId);
        
      if (progressError) {
        console.error(`Failed to delete chapter progress:`, progressError);
        results.progress.error = progressError.message;
        return NextResponse.json({ 
          error: 'Failed to delete chapter progress', 
          details: results 
        }, { status: 500 });
      }
      
      console.log(`Successfully deleted all chapter progress`);
      results.progress.success = true;
      
      // STEP 4: Verify no remaining references before deleting world
      let hasRemainingReferences = false;
      
      // Check if any conversations remain
      const { count: remainingConversations, error: checkConvoError } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('world_id', worldId);
        
      if (checkConvoError) {
        console.error(`Error checking remaining conversations:`, checkConvoError);
      } else if (remainingConversations && remainingConversations > 0) {
        console.error(`Found ${remainingConversations} conversations still linked to world ${worldId}`);
        hasRemainingReferences = true;
      }
      
      // Check if any chapter progress remains
      const { count: remainingProgress, error: checkProgressError } = await supabase
        .from('user_chapter_progress')
        .select('*', { count: 'exact', head: true })
        .eq('world_id', worldId);
        
      if (checkProgressError) {
        console.error(`Error checking remaining progress:`, checkProgressError);
      } else if (remainingProgress && remainingProgress > 0) {
        console.error(`Found ${remainingProgress} progress records still linked to world ${worldId}`);
        hasRemainingReferences = true;
      }
      
      if (hasRemainingReferences) {
        console.error(`Cannot delete world ${worldId} because it still has references`);
        return NextResponse.json({ 
          error: 'Cannot delete world - references still exist', 
          details: results 
        }, { status: 500 });
      }
      
      // STEP 5: Finally delete the world
      console.log(`Deleting world ${worldId}`);
      
      const { error: worldDeleteError } = await supabase
        .from('worlds')
        .delete()
        .eq('id', worldId);
        
      if (worldDeleteError) {
        console.error(`Failed to delete world:`, worldDeleteError);
        results.world.error = worldDeleteError.message;
        return NextResponse.json({ 
          error: `Failed to delete world: ${worldDeleteError.message}`, 
          details: results 
        }, { status: 500 });
      }
      
      console.log(`Successfully deleted world ${worldId}`);
      results.world.success = true;
      
      // Final verification
      const { data: worldCheck } = await supabase
        .from('worlds')
        .select('id')
        .eq('id', worldId);
        
      if (worldCheck && worldCheck.length > 0) {
        console.error(`World ${worldId} still exists after deletion!`);
        return NextResponse.json({ 
          error: 'World still exists after deletion', 
          details: results 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'World and all related data completely deleted',
        details: results
      });
    } catch (innerError: any) {
      console.error('Error during deletion process:', innerError);
      return NextResponse.json({ 
        error: `Deletion process error: ${innerError.message}`,
        details: results
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error resetting story:', error);
    return NextResponse.json({ 
      error: `An unexpected error occurred: ${error.message}`
    }, { status: 500 });
  }
} 