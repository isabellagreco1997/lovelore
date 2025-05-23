/*
  # Add CASCADE DELETE Constraints

  This migration adds proper foreign key constraints with CASCADE DELETE
  to ensure that deleting a world automatically deletes all related data.

  1. Foreign Key Constraints
    - conversations.world_id → worlds.id ON DELETE CASCADE
    - messages.conversation_id → conversations.id ON DELETE CASCADE  
    - user_chapter_progress.world_id → worlds.id ON DELETE CASCADE

  2. This will ensure that:
    - Deleting a world automatically deletes all conversations and progress
    - Deleting a conversation automatically deletes all messages
*/

-- Add CASCADE DELETE constraint for conversations → worlds
ALTER TABLE conversations 
DROP CONSTRAINT IF EXISTS conversations_world_id_fkey;

ALTER TABLE conversations 
ADD CONSTRAINT conversations_world_id_fkey 
FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE;

-- Add CASCADE DELETE constraint for messages → conversations  
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;

ALTER TABLE messages 
ADD CONSTRAINT messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- Add CASCADE DELETE constraint for user_chapter_progress → worlds
ALTER TABLE user_chapter_progress 
DROP CONSTRAINT IF EXISTS user_chapter_progress_world_id_fkey;

ALTER TABLE user_chapter_progress 
ADD CONSTRAINT user_chapter_progress_world_id_fkey 
FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE;

-- Also ensure worlds → stories constraint exists (should not CASCADE since stories are reusable)
ALTER TABLE worlds 
DROP CONSTRAINT IF EXISTS worlds_story_id_fkey;

ALTER TABLE worlds 
ADD CONSTRAINT worlds_story_id_fkey 
FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE RESTRICT; 