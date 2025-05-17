# LoveLore App

An interactive storytelling platform that allows users to engage with AI-generated narratives.

## Features

- Browse and select from a variety of stories
- Interact with stories through natural language conversations
- Experience adaptive storylines that respond to your choices
- Multiple chapters with different narrative objectives

## Setup

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Connection
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Deepseek API Configuration (server-side only)
DEEPSEEK_API_URL=https://api.deepseek.ai/v1/chat/completions
DEEPSEEK_API_KEY=your-deepseek-api-key
```

Replace the placeholder values with your actual API credentials.

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Deepseek API Integration

The application integrates with Deepseek AI for generating interactive story content. This integration:

1. Generates initial chapter introductions when you start a new chapter
2. Creates responses to your messages within the conversation
3. Maintains context awareness of the current story and chapter

To use the Deepseek API:

1. Sign up for a Deepseek API key at [deepseek.ai](https://deepseek.ai)
2. Add your API key to the `.env.local` file
3. Adjust model parameters in `src/app/api/deepseek/route.ts` if needed

The application now uses a secure server-side API route to communicate with DeepSeek, keeping your API key confidential.

## Technology Stack

- Next.js for the front-end framework
- Tailwind CSS for styling
- Supabase for database and authentication
- Deepseek AI for story generation

## Project Structure

```
loveloreapp/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── deepseek/       # Backend API route for DeepSeek
│   │   ├── page.tsx            # Story list page (after login)
│   │   └── story/[id]/
│   │       └── page.tsx        # Story info + chapter selector
│   │   
│   ├── components/             # Reusable UI components
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Supabase & DeepSeek clients
│   ├── styles/                 # Global styles
│   └── types/                  # Type definitions
├── .env                        # Environment variables
├── next.config.js              # Next.js configuration
├── package.json                # Project dependencies
└── tailwind.config.js          # Tailwind CSS configuration
```

## License

This project is licensed under the MIT License. 