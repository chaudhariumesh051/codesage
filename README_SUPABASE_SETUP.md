# CodeOrbit Supabase Setup Instructions

## Getting Your Supabase Credentials

To connect CodeOrbit to your Supabase database, you need to get your actual Supabase project credentials:

### Step 1: Access Your Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project (or create a new one if you don't have one)

### Step 2: Get Your API Keys
1. In your project dashboard, click on the **Settings** icon in the left sidebar
2. Click on **API** in the settings menu
3. You'll see your project credentials:
   - **Project URL**: This is your `VITE_SUPABASE_URL`
   - **Project API keys**:
     - **anon public**: This is your `VITE_SUPABASE_ANON_KEY`
     - **service_role secret**: This is your `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Update Your Environment Variables
1. Open your `.env` file in the project root
2. Replace the placeholder values with your actual credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

### Step 4: Run Database Migrations
The database schema will be automatically created when you first run the application. The migration includes:

- **User Management**: Profiles, sessions, security logs, preferences
- **Code Analysis**: Submissions, analyses, solutions, execution results
- **AI Features**: Chat history, usage tracking, AI models
- **Learning System**: Challenges, progress tracking, achievements
- **Subscription System**: Plans, billing, usage limits
- **Content Management**: Videos, file uploads, exports
- **Security**: Audit logs, rate limiting, feature flags

### Step 5: Restart Your Development Server
After updating the `.env` file:
1. Stop your development server (Ctrl+C)
2. Start it again with `npm run dev`

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

## Security Notes

- **Never commit your `.env` file to version control**
- The `anon` key is safe to use in client-side code
- The `service_role` key should only be used server-side (in edge functions)
- Keep your `service_role` key secret as it has admin privileges

## Troubleshooting

If you're still getting authentication errors:

1. **Double-check your credentials**: Make sure you copied the keys correctly
2. **Check for extra spaces**: Ensure there are no leading/trailing spaces in your keys
3. **Verify project status**: Make sure your Supabase project is active and not paused
4. **Clear browser cache**: Sometimes cached credentials can cause issues
5. **Check database migrations**: Ensure all tables were created successfully

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