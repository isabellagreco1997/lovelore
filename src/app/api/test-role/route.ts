import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin();
    
    // Let's query the table constraints directly to understand the check constraint
    const { data: constraints, error: constraintError } = await supabase
      .from('pg_constraint')
      .select('*')
      .ilike('conname', '%messages_role_check%');
      
    if (constraintError) {
      console.error('Error querying constraints:', constraintError);
      return NextResponse.json({ error: 'Failed to query constraints' }, { status: 500 });
    }
    
    // Try to get the schema information a different way
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_schema_info', { table_name: 'messages' });
      
    if (tableError) {
      console.error('Error getting table info:', tableError);
    }
    
    // Try direct test approach
    const testValues = ['user', 'assistant', 'system', 'USER', 'ASSISTANT', 'SYSTEM'];
    const testResults = [];
    
    // Create a temporary conversation for testing
    const { data: world, error: worldError } = await supabase
      .from('worlds')
      .select('id, user_id')
      .limit(1)
      .single();
      
    if (worldError || !world) {
      return NextResponse.json({ error: 'Could not find a valid world' }, { status: 500 });
    }
    
    const { data: conversation, error: convoError } = await supabase
      .from('conversations')
      .insert({
        world_id: world.id,
        user_id: world.user_id,
        chapter_id: 'test-chapter',
        started_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (convoError) {
      console.error('Error creating test conversation:', convoError);
      return NextResponse.json({ error: 'Failed to create test conversation' }, { status: 500 });
    }
    
    // Test each value
    for (const roleValue of testValues) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            role: roleValue,
            content: `Test with role: ${roleValue}`,
            timestamp: new Date().toISOString()
          })
          .select();
          
        testResults.push({
          role: roleValue,
          success: !error,
          error: error ? error.message : null
        });
      } catch (error) {
        testResults.push({
          role: roleValue,
          success: false,
          error: 'Exception thrown'
        });
      }
    }
    
    // Clean up test data when done
    await supabase
      .from('conversations')
      .delete()
      .eq('id', conversation.id);
      
    return NextResponse.json({
      schemaConstraints: constraints,
      tableInfo: tableInfo,
      testResults: testResults
    });
    
  } catch (error: any) {
    console.error('Error in test route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 