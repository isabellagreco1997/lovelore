# Resend Email Setup Guide

## Prerequisites

1. **Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Domain Verification**: You'll need to verify a domain with Resend to send emails

## Configuration Steps

### 1. Get Your Resend API Key

1. Log into your Resend dashboard
2. Navigate to "API Keys" section
3. Create a new API key
4. Copy the API key

### 2. Set Environment Variables

Create a `.env.local` file in your project root and add:

```env
RESEND_API_KEY=your_resend_api_key_here
```

### 3. Domain Setup

**Important**: You need to update the `from` field in `/src/app/api/contact/route.ts`

Replace:
```typescript
from: 'contact@your-domain.com'
```

With your verified domain:
```typescript
from: 'contact@yourdomain.com'  // Replace with your actual domain
```

### 4. Domain Verification Options

You have a few options for the sending domain:

#### Option A: Use Your Own Domain (Recommended)
1. Add and verify your domain in Resend dashboard
2. Update the `from` field to use your domain

#### Option B: Use Resend's Testing Domain
For testing purposes, you can use Resend's onboarding domain:
```typescript
from: 'onboarding@resend.dev'
```

**Note**: This is only for testing and has limitations.

## How It Works

1. User fills out the contact form on `/contact`
2. Form data is sent to `/api/contact`
3. API validates the data
4. Email is sent to `lovelore.contact@gmail.com` using Resend
5. The email includes:
   - Sender's name and email
   - Subject and message
   - Nice HTML formatting
   - Reply-to set to sender's email for easy responses

## Testing

1. Make sure your environment variables are set
2. Start your development server: `npm run dev`
3. Navigate to `/contact`
4. Fill out and submit the form
5. Check `lovelore.contact@gmail.com` for the email

## Troubleshooting

- **403 Error**: Check your API key is correct
- **Domain not verified**: Make sure you've verified your domain in Resend
- **Rate limits**: Free tier has sending limits

## Features

- Form validation (client and server-side)
- HTML email templates
- Reply-to functionality
- Error handling
- Success/error feedback to users 