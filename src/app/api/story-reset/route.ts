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
    
    // Get the world ID associated with this story AND user
    // Each user has their own world instance for each story
    const { data: worldData, error: worldError } = await supabase
      .from('worlds')
      .select('*')
      .eq('story_id', storyId)
      .eq('user_id', userId)
      .single();
      
    if (worldError) {
      console.log(`World not found for story ${storyId} and user ${userId}, nothing to reset`);
      return NextResponse.json({ error: 'World not found for this story and user', status: 404 });
    }
    
    const worldId = worldData.id;
    console.log(`Found world ${worldId} for story ${storyId} and user ${userId}, proceeding with CASCADE deletion`);
    
    try {
      // With proper CASCADE DELETE constraints, we only need to delete the world
      // This will automatically delete:
      // - All conversations for this world (CASCADE)
      // - All messages in those conversations (CASCADE) 
      // - All user progress for this world (CASCADE)
      
      console.log(`Deleting world ${worldId} with CASCADE DELETE`);
      
      const { error: worldDeleteError } = await supabase
        .from('worlds')
        .delete()
        .eq('id', worldId);
        
      if (worldDeleteError) {
        console.error(`Failed to delete world:`, worldDeleteError);
        return NextResponse.json({ 
          error: `Failed to delete world: ${worldDeleteError.message}`
        }, { status: 500 });
      }
      
      console.log(`Successfully deleted world ${worldId} and all related data via CASCADE`);
      
      // Verify deletion was successful
      const { data: worldCheck } = await supabase
        .from('worlds')
        .select('id')
        .eq('id', worldId);
        
      if (worldCheck && worldCheck.length > 0) {
        console.error(`World ${worldId} still exists after deletion!`);
        return NextResponse.json({ 
          error: 'World still exists after deletion'
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'World and all related data completely deleted via CASCADE DELETE'
      });
      
    } catch (innerError: any) {
      console.error('Error during deletion process:', innerError);
      return NextResponse.json({ 
        error: `Deletion process error: ${innerError.message}`
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error resetting story:', error);
    return NextResponse.json({ 
      error: `An unexpected error occurred: ${error.message}`
    }, { status: 500 });
  }
} 