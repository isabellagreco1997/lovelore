# LoveLore App

An interactive storytelling platform that allows users to engage with AI-generated narratives.

## Features

- Browse and select from a variety of stories
- Interact with stories through natural language conversations
- Experience adaptive storylines that respond to your choices
- Multiple chapters with different narrative objectives
- **Interactive Storytelling**: Create and participate in dynamic, AI-generated stories
- **User Authentication**: Secure signup and login with email confirmation
- **Account Management**: User profiles and settings
- **Story Management**: Create, save, and continue stories
- **AI Integration**: Powered by AI for story generation

## Authentication Flow

### Email Confirmation
When users create a new account:
1. User fills out the signup form with email and password
2. Account is created but requires email verification
3. User receives a confirmation email (check spam folder if not found)
4. User clicks the confirmation link in the email
5. Account is activated and user can sign in

**Note**: Email confirmation is required before users can sign in to their account.

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

## LoadingSpinner Component

The `LoadingSpinner` component is a unified loading component that handles all loading states throughout the application. It replaces multiple custom loading implementations with a single, consistent component.

### Usage

```tsx
import LoadingSpinner from '@/components/LoadingSpinner';

// Basic spinner
<LoadingSpinner />

// Spinner with text
<LoadingSpinner 
  variant="spinner" 
  size="sm" 
  theme="purple" 
  text="Loading..." 
/>

// Fullscreen loading
<LoadingSpinner
  variant="fullscreen"
  theme="purple"
  fullscreenTitle="Loading Your Story"
  fullscreenSubtitle="Please wait while we prepare your adventure..."
  showDots={true}
/>

// Skeleton loading
<LoadingSpinner
  variant="skeleton"
  skeleton={{
    image: true,
    lines: 3,
    button: true,
    height: "h-64"
  }}
  className="bg-gray-800/50 rounded-xl"
/>

// Inline loading
<LoadingSpinner
  variant="inline"
  size="sm"
  theme="current"
  text="Sending..."
/>
```

### Props

- `variant`: 'spinner' | 'pulse' | 'skeleton' | 'fullscreen' | 'inline'
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `theme`: 'purple' | 'pink' | 'blue' | 'gray' | 'current'
- `text`: Optional text to display with the spinner
- `fullscreenTitle`: Title for fullscreen variant
- `fullscreenSubtitle`: Subtitle for fullscreen variant
- `showDots`: Show animated dots for fullscreen variant
- `skeleton`: Configuration for skeleton loading
- `inline`: Whether to render inline
- `center`: Whether to center the content
- `className`: Additional CSS classes

### Variants

1. **Spinner**: Basic spinning loader
2. **Pulse**: Simple pulsing animation
3. **Skeleton**: Placeholder content with shimmer effect
4. **Fullscreen**: Full-screen loading overlay
5. **Inline**: Inline loading for buttons and small spaces

### Migration

All existing loading states have been migrated to use this component:
- Chapter page complex loading screens
- Story list loading
- Account page loading
- Debug page loading
- Conversation view inline spinners
- Skeleton loading cards
- Subscription manager loading states 