import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const API_TIMEOUT = 30000; // 30 seconds timeout

export async function POST(request: NextRequest) {
  console.log('API route /api/deepseek called');
  
  if (!DEEPSEEK_API_KEY) {
    console.error('DeepSeek API key not configured on the server');
    return NextResponse.json(
      { error: 'DeepSeek API key not configured on the server' },
      { status: 500 }
    );
  }

  try {
    const requestData = await request.json();
    
    // Check if streaming is requested
    const useStreaming = requestData.stream === true;
    
    // Construct the full URL by appending the endpoint
    const apiUrl = `${DEEPSEEK_BASE_URL}/v1/chat/completions`;
    
    console.log('Forwarding request to DeepSeek API:', JSON.stringify({
      url: apiUrl,
      model: requestData.model || 'deepseek-chat',
      messagesCount: requestData.messages?.length || 0,
      streaming: useStreaming
    }));
    
    console.log('Making request to DeepSeek with API Key:', DEEPSEEK_API_KEY.substring(0, 5) + '...');
    
    // Create the fetch request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: requestData.model || 'deepseek-chat',
        messages: requestData.messages,
        temperature: requestData.temperature || 0.7,
        max_tokens: requestData.max_tokens || 1000,
        stream: useStreaming
      })
    });

    console.log('DeepSeek API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        console.error('DeepSeek API error:', errorData);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        const errorText = await response.text();
        console.error('DeepSeek API error text:', errorText);
        errorMessage += ' - ' + errorText;
      }
      
      return NextResponse.json(
        { error: `DeepSeek API error: ${errorMessage}` },
        { status: response.status }
      );
    }

    // If streaming is requested and supported
    if (useStreaming && response.body !== null && response.body !== undefined) {
      // Stream the response directly to the client
      return new Response(
        new ReadableStream({
          async start(controller) {
            const decoder = new TextDecoder();
            const encoder = new TextEncoder();
            const reader = response.body!.getReader();
            let done = false;
            let buffer = '';
            
            while (!done) {
              const { value, done: doneReading } = await reader.read();
              done = doneReading;
              
              if (value) {
                // DeepSeek may use OpenAI-style data: lines
                buffer += decoder.decode(value, { stream: true });
                let lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                  if (line.trim().startsWith('data:')) {
                    const data = line.replace(/^data:\s*/, '');
                    if (data === '[DONE]') continue;
                    
                    try {
                      const parsed = JSON.parse(data);
                      const content = parsed.choices?.[0]?.delta?.content;
                      if (content) {
                        controller.enqueue(encoder.encode(content));
                      }
                    } catch (e) {
                      // Ignore JSON parse errors
                    }
                  }
                }
              }
            }
            
            controller.close();
          }
        }),
        {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Transfer-Encoding': 'chunked',
          },
        }
      );
    }
    
    // For non-streaming requests, return as normal JSON
    const data = await response.json();
    console.log('DeepSeek API parsed response:', JSON.stringify(data).substring(0, 200) + '...');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in DeepSeek API route:', error);
    return NextResponse.json(
      { error: `Error processing request: ${error.message}`, stack: error.stack },
      { status: 500 }
    );
  }
} 