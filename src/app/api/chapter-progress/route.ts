import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { user_id, world_id, chapter_id, is_completed } = await request.json();
    
    // Validate required fields
    if (!user_id || !world_id || !chapter_id) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, world_id, and chapter_id are required' },
        { status: 400 }
      );
    }
    
    console.log('Updating chapter progress with params:', { 
      user_id, 
      world_id, 
      chapter_id, 
      is_completed 
    });
    
    const supabase = supabaseAdmin();
    
    // Check if the record already exists
    const { data: existingRecord, error: queryError } = await supabase
      .from('user_chapter_progress')
      .select('*')
      .eq('user_id', user_id)
      .eq('world_id', world_id)
      .eq('chapter_id', chapter_id)
      .maybeSingle();
    
    if (queryError) {
      console.error('Error checking existing progress:', queryError);
      return NextResponse.json(
        { error: `Error checking progress: ${queryError.message}` },
        { status: 500 }
      );
    }
    
    let result;
    
    if (existingRecord) {
      // Update existing record
      const { data, error } = await supabase
        .from('user_chapter_progress')
        .update({ 
          is_completed: is_completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating chapter progress:', error);
        return NextResponse.json(
          { error: `Error updating progress: ${error.message}` },
          { status: 500 }
        );
      }
      
      result = { progress: data, updated: true };
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('user_chapter_progress')
        .insert({
          user_id,
          world_id,
          chapter_id,
          is_completed: is_completed ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating chapter progress:', error);
        return NextResponse.json(
          { error: `Error creating progress: ${error.message}` },
          { status: 500 }
        );
      }
      
      result = { progress: data, created: true };
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error processing chapter progress update:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
} 