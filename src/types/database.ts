export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface World {
  id: string;
  user_id: string;
  name: string;
  genre: string;
  description: string;
  tone: string;
  image: string;
  created_at: string;
  is_prebuilt: boolean;
  story_id: string;
}

export interface Chapter {
  chapterName: string;
  objective: string;
  chapterContext: string;
}

export interface StoryContext {
  tone: string;
  themes: string[];
  setting: {
    company?: {
      name: string;
      size: string;
    };
    location: string;
    time_period: string;
  };
  // Additional fields can be added as needed
}

export interface Story {
  id: string;
  world_name: string;
  story_context: StoryContext;
  created_at: string;
  image: string;
  logo_image?: string;
  description: string;
  chapters: Chapter[];
}

export interface Conversation {
  id: string;
  world_id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  chapter_id: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface UserChapterProgress {
  id: string;
  user_id: string;
  world_id: string;
  chapter_id: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
} 