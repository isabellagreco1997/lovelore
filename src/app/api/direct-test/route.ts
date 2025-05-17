import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }

    // Create a Supabase client with direct connection
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Execute a raw SQL query to examine the table definition
    const { data: tableDefinition, error: tableError } = await supabase
      .rpc('get_role_constraint_info');

    if (tableError) {
      console.error('Error getting table definition:', tableError);
      
      // Fallback: Run a simpler query
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'messages')
        .eq('column_name', 'role');
        
      if (error) {
        return NextResponse.json({ 
          error: 'Could not get table definition', 
          details: tableError 
        }, { status: 500 });
      }
      
      return NextResponse.json({ columnInfo: data });
    }

    // Try an actual insert to see what happens
    // First get a conversation ID to work with
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1)
      .single();
      
    if (convError) {
      return NextResponse.json({ error: 'No conversation found' }, { status: 500 });
    }
    
    // Try different values for the role
    let testResults = [];
    const testValues = [
      'user', 'assistant', 'system', 
      'USER', 'ASSISTANT', 'SYSTEM',
      'User', 'Assistant', 'System'
    ];
    
    for (const role of testValues) {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: role,
          content: `Test message with role: ${role}`,
          timestamp: new Date().toISOString()
        })
        .select();
        
      testResults.push({
        role,
        success: !error,
        error: error ? error.message : null
      });
      
      // If successful, delete the test message
      if (data && data.length > 0) {
        await supabase
          .from('messages')
          .delete()
          .eq('id', data[0].id);
      }
    }

    return NextResponse.json({
      tableDefinition,
      testResults
    });
    
  } catch (error: any) {
    console.error('Error in direct test:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 