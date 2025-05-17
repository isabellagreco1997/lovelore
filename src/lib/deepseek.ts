import { Message } from '@/types/database';

// Use our API route instead of calling DeepSeek directly
// Fix URL to work in both client and server contexts
const getApiUrl = () => {
  // When running on the server in an API route
  if (typeof window === 'undefined') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/api/deepseek`;
  }
  // When running in the browser
  return '/api/deepseek';
};

// Interface for story context that will be sent to Deepseek
interface StoryContext {
  storyName?: string;
  chapterName?: string;
  chapterContext?: string;
  chapterObjective?: string;
}

// Interface for story generation result
export interface StoryGenerationResult {
  content: string;
  objectiveCompleted: boolean;
}

/**
 * Stream AI responses from DeepSeek API
 * @param prompt User prompt
 * @param storyContext Context information about the story and chapter
 * @param onChunk Callback function to handle each chunk of the response
 * @param previousMessages Previous messages in the conversation
 * @param previousChapterSummary Optional summary from previous chapter for continuity
 * @param previousChapterMessages Optional messages from previous chapter for continuity
 * @returns Promise that resolves with the final content and objective completion status
 */
export async function streamAIResponse(
  prompt: string,
  storyContext: StoryContext,
  onChunk: (chunk: string) => void,
  previousMessages: Array<{role: string, content: string}> = [],
  previousChapterSummary?: string,
  previousChapterMessages?: Array<{role: string, content: string}>
): Promise<StoryGenerationResult> {
  // Prepare messages array
  let allMessages = [];
  
  // Add system message
  const systemMessage = {
    role: 'system',
    content: `You are an AI storyteller creating an interactive narrative experience. 
             The story world is: ${storyContext.storyName || 'Unknown'}. 
             The chapter is: ${storyContext.chapterName || 'Unknown'}.
             The chapter context is: ${storyContext.chapterContext || 'Unknown'}.
             ${storyContext.chapterObjective ? `The chapter objective is: ${storyContext.chapterObjective}.` : ''}
             ${previousChapterSummary ? `\n\n${previousChapterSummary}` : ''}
             ${previousChapterMessages && previousChapterMessages.length > 0 ? `\n\nThe previous chapter's final exchanges will be provided after this message for continuity.` : ''}
             
             Critical requirements:
             1. Respond in-character as if you're narrating this story.
             2. DO NOT end your responses with explicit questions like "What do you want to do?" or "What will you do next?"
             3. DO NOT add meta-commentary or list options for the user.
             4. NEVER provide the user with a list of choices, options, or possible actions (like "You could: 1. Go left, 2. Go right").
             5. DO NOT structure your response with bullet points of possible actions or numbered lists of choices.
             6. DO NOT describe multiple potential actions the user could take, even in narrative form. Avoid phrases like "you could...", "you might...", "you can choose to..." or similar phrases that suggest multiple options.
             7. Simply describe the scene, focusing on what IS happening, not what COULD happen.
             8. Focus on rich atmospheric descriptions, sensory details, and the current state of the environment and characters.
             9. Let the user decide completely on their own what to do next without any suggestions from you.
             10. End your responses with descriptive statements about the current moment, not what might happen next.
             ${previousChapterSummary || (previousChapterMessages && previousChapterMessages.length > 0) ? `11. When starting a new chapter, always reference and acknowledge what happened at the end of the previous chapter. Create a sense of continuity in the story.` : ''}`
  };

  console.log('systemMessage', systemMessage);
  
  allMessages.push(systemMessage);
  
  // Add previous chapter messages if provided (limited to last 4 to avoid context overflow)
  if (previousChapterMessages && previousChapterMessages.length > 0) {
    // Filter to just get the last few exchanges
    const limitedPreviousMessages = previousChapterMessages.slice(-Math.min(4, previousChapterMessages.length));
    
    if (limitedPreviousMessages.length > 0) {
      // Add a divider with stronger instructions for continuity
      allMessages.push({
        role: 'system',
        content: `The following are the last few exchanges from the previous chapter. This is critical story context.
                 You MUST maintain narrative continuity with these events and refer to them in your introductory narration.
                 The user's character should be in the same state they were in at the end of the previous chapter.`
      });
      
      // Add the previous chapter messages
      allMessages = [...allMessages, ...limitedPreviousMessages];
      
      // Add another divider to mark the start of current chapter
      allMessages.push({
        role: 'system',
        content: `Now we are continuing to the current chapter: ${storyContext.chapterName}. 
                 Your first response MUST create a narrative bridge from the previous chapter to this one.
                 Explicitly reference what happened at the end of the previous chapter and how it connects to the current situation.
                 Acknowledge any significant changes in environment or situation, but maintain character continuity.`
      });
    }
  }
  
  // Add current conversation messages
  allMessages = [...allMessages, ...previousMessages];
  
  // Add the current user prompt
  allMessages.push({ role: 'user', content: prompt });
  
  // Format messages for the API - formattedMessages is now allMessages
  const response = await fetch('/api/deepseek', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      model: 'deepseek-chat',
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  if (!response.body) throw new Error('No response body');
  
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let fullContent = '';
  
  try {
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = decoder.decode(value, { stream: !done });
        if (chunk) {
          fullContent += chunk;
          onChunk(chunk);
        }
      }
    }
    
    // Once streaming is complete, check objective completion with a separate call
    const objectiveCompleted = await checkObjectiveCompletion(
      fullContent, 
      prompt,
      storyContext.chapterObjective || '',
      previousMessages
    );
    
    return {
      content: fullContent,
      objectiveCompleted
    };
  } catch (error) {
    console.error('Error while reading stream:', error);
    throw error;
  }
}

/**
 * Check if the user's actions have completed the chapter objective
 * Uses a separate API call to avoid adding markers to the story text
 * @param content The generated story content
 * @param userPrompt The user's most recent prompt
 * @param objective The chapter objective
 * @param previousMessages Previous conversation messages
 * @returns Boolean indicating whether the objective is completed
 */
export async function checkObjectiveCompletion(
  content: string,
  userPrompt: string,
  objective: string,
  previousMessages: Array<{role: string, content: string}> = []
): Promise<boolean> {
  if (!objective) return false;
  
  try {
    // Make a separate API call just to check if the objective was completed
    const checkMessages = [
      {
        role: 'system',
        content: `You are an objective completion checker. Your only task is to determine if the user's actions have satisfied the given objective.
                  
                  Objective: ${objective}
                  
                  Analyze ONLY the most recent user prompt and AI response to determine if the objective has been completed.
                  Reply with just "YES" if the objective is clearly completed, or "NO" if it is not completed yet.
                  
                  DO NOT explain your reasoning or add any other text. Respond with either "YES" or "NO" only.
                  This analysis should not affect the narrative in any way or suggest choices to the user.`
      },
      // Include the last few message exchanges for context
      ...previousMessages.slice(-4),
      // Include user's most recent prompt
      { role: 'user', content: userPrompt },
      // Include the AI's response to that prompt
      { role: 'assistant', content: content },
      // Final question to the checker
      { role: 'user', content: 'Based only on the above exchange, has the user completed the objective? Answer with just YES or NO.' }
    ];
    
    const response = await fetch('/api/deepseek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: checkMessages,
        temperature: 0.1, // Low temperature for more consistent answers
        max_tokens: 10 // We just need a short answer
      })
    });
    
    if (!response.ok) {
      console.error('Error checking objective completion:', response.statusText);
      return false;
    }
    
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || '';
    
    // Check if the response contains YES
    return answer.toUpperCase().includes('YES');
  } catch (error) {
    console.error('Error checking objective completion:', error);
    return false;
  }
}

/**
 * Get story context by conversation data
 * @param conversation The conversation object containing chapter_id
 * @param storyData Optional story data if already available
 * @returns StoryContext object with relevant chapter information
 */
export async function getStoryContextFromConversation(
  conversation: any, 
  storyData?: any
): Promise<StoryContext> {
  // If we already have story data provided, use it
  if (storyData) {
    // Find the chapter that matches the chapter_id in the conversation
    const chapter = storyData.chapters?.find(
      (ch: any) => ch.chapterName === conversation.chapter_id
    );
    
    if (chapter) {
      return {
        storyName: storyData.world_name,
        chapterName: chapter.chapterName,
        chapterContext: chapter.chapterContext,
        chapterObjective: chapter.objective
      };
    }
  }
  
  // If no story data or chapter not found, return minimal context
  return {
    storyName: 'Unknown Story',
    chapterName: conversation.chapter_id || 'Unknown Chapter',
    chapterContext: 'No context available for this chapter.',
    chapterObjective: 'Continue the story.'
  };
}

/**
 * Get the last N messages from a previous chapter conversation
 * @param supabase Supabase client instance
 * @param worldId The world ID for the story
 * @param userId The user ID
 * @param previousChapterId The previous chapter's ID
 * @param limit Number of messages to fetch (default: 4)
 * @returns Array of messages from the previous chapter
 */
export async function getPreviousChapterMessages(
  supabase: any,
  worldId: string,
  userId: string,
  previousChapterId: string,
  limit: number = 4
): Promise<Array<{role: string, content: string}>> {
  try {
    console.log("getPreviousChapterMessages - Starting with params:", {
      worldId,
      userId,
      previousChapterId,
      limit
    });
    
    // First find the most recent conversation for the given chapter
    const { data: conversations, error: convoError } = await supabase
      .from('conversations')
      .select('id')
      .eq('world_id', worldId)
      .eq('user_id', userId)
      .eq('chapter_id', previousChapterId)
      .order('started_at', { ascending: false })
      .limit(1);
    
    if (convoError || !conversations || conversations.length === 0) {
      console.log('No previous conversation found for continuity');
      return [];
    }

    const conversationId = conversations[0].id;
    
    // Now get the last few messages from that conversation
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (msgError || !messages) {
      console.log('Error fetching previous chapter messages:', msgError);
      return [];
    }
    
    // Reverse the messages to get them in chronological order
    const reversedMessages = messages.reverse();
    console.log(`Found ${reversedMessages.length} messages from previous chapter for continuity`);
    return reversedMessages;
  } catch (error) {
    console.error('Error in getPreviousChapterMessages:', error);
    return [];
  }
}

/**
 * Format a brief summary of previous chapter events based on last messages
 * @param messages Array of previous chapter messages
 * @returns A formatted string with the previous chapter summary
 */
export function formatPreviousChapterSummary(messages: Array<{role: string, content: string}>): string {
  if (!messages || messages.length === 0) {
    return '';
  }
  
  let summary = '**End of Previous Chapter:**\n\n';
  
  // Extract just the assistant messages, as they contain the narrative
  const narrativeMessages = messages.filter(msg => msg.role === 'assistant');
  const userMessages = messages.filter(msg => msg.role === 'user');
  
  // If we have assistant messages, use them for the summary
  if (narrativeMessages.length > 0) {
    // Get the last user action and the last assistant response for context
    const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';
    const lastAssistantMessage = narrativeMessages[narrativeMessages.length - 1].content;
    
    // Add the last user action if available
    if (lastUserMessage) {
      summary += `Last action: ${lastUserMessage}\n\n`;
    }
    
    // Add the final narrative state from the last assistant message
    // Get the last 2-3 paragraphs to capture the ending state better
    const paragraphs = lastAssistantMessage.split('\n\n');
    const endingParagraphs = paragraphs.slice(-Math.min(3, paragraphs.length));
    
    summary += endingParagraphs.join('\n\n');
  } else {
    // If no assistant messages, use whatever we have
    summary += messages.map(msg => msg.content).join('\n\n');
  }
  
  return summary.trim();
} 