# CodeOrbit Supabase Setup Instructions

## 🚨 IMPORTANT: Connection Issues?

If you're seeing "Failed to fetch" errors, your Supabase credentials are likely incorrect or your project may be paused. Follow these steps carefully:

## Getting Your Supabase Credentials

To connect CodeOrbit to your Supabase database, you need to get your actual Supabase project credentials:

### Step 1: Access Your Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project (or create a new one if you don't have one)

### Step 2: Check Project Status
1. Make sure your project is **ACTIVE** and not paused
2. If your project is paused, click "Resume" to reactivate it
3. Free tier projects pause after 1 week of inactivity

### Step 3: Get Your API Keys
1. In your project dashboard, click on the **Settings** icon in the left sidebar
2. Click on **API** in the settings menu
3. You'll see your project credentials:
   - **Project URL**: This is your `VITE_SUPABASE_URL`
   - **Project API keys**:
     - **anon public**: This is your `VITE_SUPABASE_ANON_KEY`
     - **service_role secret**: This is your `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Update Your Environment Variables
1. Open your `.env` file in the project root
2. Replace the placeholder values with your actual credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here

# AI Services
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### Step 5: Verify Your Credentials
1. Make sure your `VITE_SUPABASE_URL` follows this format: `https://[project-ref].supabase.co`
2. Make sure your `VITE_SUPABASE_ANON_KEY` is a long JWT token starting with `eyJ`
3. Double-check there are no extra spaces or characters

### Step 6: Restart Your Development Server
After updating the `.env` file:
1. Stop your development server (Ctrl+C)
2. Start it again with `npm run dev`
3. Check the browser console for any connection test messages

## Database Schema Overview

CodeOrbit uses a comprehensive database schema with the following main components:

### Authentication & User Management
- `user_profiles` - Extended user information beyond Supabase auth
- `user_sessions` - Multi-device session tracking
- `user_security_logs` - Security audit trail
- `user_preferences` - User settings and preferences

### Code Analysis System
- `code_submissions` - User code submissions
- `code_analyses` - AI analysis results
- `problem_solutions` - Generated solutions
- `code_execution_results` - Code execution history
- `flowcharts` - Generated flowcharts

### AI Assistant & Chat
- `chat_history` - AI conversation history
- `ai_models` - Available AI models
- `usage_tracking` - API usage tracking

### Learning & Challenges
- `challenges` - Coding challenges
- `user_progress` - Learning progress tracking
- `achievements` - User achievements system
- `user_achievements` - User-specific achievements
- `learning_paths` - Structured learning paths

### Subscription & Billing
- `subscription_plans` - Available subscription plans
- `user_subscriptions` - User subscription data
- `billing_history` - Payment history
- `usage_limits` - Feature usage limits

### Content & Media
- `videos` - Generated video content
- `file_uploads` - User uploaded files
- `exports` - Exported content

### Security & Compliance
- `audit_logs` - System audit trail
- `rate_limits` - API rate limiting
- `feature_flags` - Feature toggles

## Security Features

The database includes comprehensive security features:

- **Row Level Security (RLS)** enabled on all tables
- **User isolation** - Users can only access their own data
- **Admin access controls** - Admins have elevated permissions
- **Rate limiting** - Prevents API abuse
- **Audit logging** - Tracks all important actions
- **Session management** - Secure multi-device login tracking

## Common Issues & Solutions

### "Failed to fetch" Error
- **Cause**: Incorrect Supabase URL or API key
- **Solution**: Double-check your credentials in the Supabase dashboard
- **Check**: Make sure your project is not paused

### "Invalid API key" Error
- **Cause**: Wrong API key or expired key
- **Solution**: Copy the anon key again from your Supabase dashboard

### "Network Error" or "CORS Error"
- **Cause**: Project is paused or URL is incorrect
- **Solution**: Resume your project and verify the URL format

### Connection Timeout
- **Cause**: Network issues or server problems
- **Solution**: Check your internet connection and try again

## Security Notes

- **Never commit your `.env` file to version control**
- The `anon` key is safe to use in client-side code
- The `service_role` key should only be used server-side (in edge functions)
- Keep your `service_role` key secret as it has admin privileges

## Troubleshooting Steps

If you're still getting authentication errors:

1. **Verify project status**: Ensure your Supabase project is active
2. **Double-check credentials**: Copy-paste keys directly from dashboard
3. **Check for typos**: Ensure no extra spaces or missing characters
4. **Clear browser cache**: Sometimes cached credentials cause issues
5. **Test connection**: Check browser console for connection test results
6. **Restart dev server**: Stop and start your development server

## Features Enabled

With this database setup, CodeOrbit supports:

- ✅ User authentication and profiles
- ✅ Code analysis and AI insights
- ✅ Problem solving with AI assistance
- ✅ AI chat assistant
- ✅ Video generation (with proper API keys)
- ✅ Learning challenges and progress tracking
- ✅ Subscription management
- ✅ File uploads and exports
- ✅ Comprehensive security and audit logging

## Next Steps

1. Set up your Gemini API key for AI features
2. Configure Tavus API for video generation (optional)
3. Set up Stripe for subscription billing (optional)
4. Customize the application branding and content

## Need Help?

If you're still experiencing issues:
1. Check the browser console for detailed error messages
2. Verify your project is active in the Supabase dashboard
3. Try creating a new Supabase project if the current one has issues
4. Make sure you're using the correct project credentials