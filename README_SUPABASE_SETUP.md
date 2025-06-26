# CodeSage Supabase Backend Setup Guide

This guide will help you set up the complete Supabase backend for the CodeSage platform with authentication, database, and subscription management.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Note down your project URL and anon key from Settings > API

### 2. Environment Variables

Create a `.env` file in your project root:

```bash
# Copy from .env.example and fill in your values
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_TAVUS_API_KEY=your_tavus_api_key
VITE_REVENUECAT_API_KEY=your_revenuecat_api_key
```

### 3. Run Database Migrations

Execute the migration files in order:

```bash
# In your Supabase SQL Editor, run these files in order:
1. supabase/migrations/create_auth_system.sql
2. supabase/migrations/create_code_analysis_system.sql
3. supabase/migrations/create_challenges_system.sql
4. supabase/migrations/create_media_storage.sql
5. supabase/migrations/create_subscription_system.sql
```

### 4. Set up Storage Buckets

In Supabase Dashboard > Storage, create these buckets:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('flowcharts', 'flowcharts', true),
('videos', 'videos', true),
('audio', 'audio', true),
('exports', 'exports', false);

-- Set up storage policies
CREATE POLICY "Users can upload own files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

### 5. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy edge functions
supabase functions deploy revenuecat-webhook
supabase functions deploy auth-hooks
```

### 6. Configure Authentication

In Supabase Dashboard > Authentication > Settings:

1. **Email Templates**: Customize signup, reset password, and magic link emails
2. **URL Configuration**: Set site URL and redirect URLs
3. **Auth Providers**: Enable email/password, magic links, and SMS OTP
4. **Security**: Configure password requirements and session settings

### 7. Set up RevenueCat Integration

1. Create a RevenueCat account and project
2. Configure webhook URL: `https://your-project.supabase.co/functions/v1/revenuecat-webhook`
3. Add webhook secret to environment variables
4. Configure products in RevenueCat dashboard

## 📊 Database Schema Overview

### Core Tables

- **user_profiles**: Extended user information and subscription status
- **user_sessions**: Multi-device session tracking
- **user_security_logs**: Security events and audit trail
- **code_submissions**: User code submissions and analysis requests
- **code_analyses**: AI analysis results and insights
- **problem_solutions**: Generated solutions for coding problems
- **challenges**: Coding challenges and problems
- **user_progress**: User progress tracking and achievements
- **video_generations**: AI video generation requests and results
- **subscription_plans**: Available subscription plans
- **user_subscriptions**: User subscription records

### Key Features

✅ **Secure Authentication**
- Email/password, magic links, SMS OTP
- Multi-device session tracking
- Brute force protection
- Security audit logging

✅ **Code Analysis System**
- Code submission tracking
- AI analysis results storage
- Execution history
- Flowchart generation

✅ **Challenge System**
- Coding challenges
- Progress tracking
- Achievement system
- Learning paths

✅ **Media Storage**
- Video file management
- Flowchart exports
- Voice narrations
- Secure file access

✅ **Subscription Management**
- RevenueCat integration
- Webhook processing
- Billing history
- Usage tracking

## 🔒 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies ensuring users can only access their own data.

### Rate Limiting
Built-in rate limiting for free users:
- Code analysis: 3 per day
- Problem solving: 3 per day
- Video generation: Pro only

### Session Management
- JWT-based authentication
- Multi-device tracking
- Session revocation
- Automatic cleanup

### Audit Logging
Complete audit trail for:
- Login attempts
- Password resets
- Account changes
- Security events

## 🔧 API Usage Examples

### Authentication

```typescript
import { AuthService } from './src/services/auth'

// Sign up
await AuthService.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  full_name: 'John Doe'
})

// Sign in
await AuthService.signIn({
  email: 'user@example.com',
  password: 'securepassword'
})

// Magic link
await AuthService.signInWithMagicLink('user@example.com')

// SMS OTP
await AuthService.signInWithOTP('+1234567890')
```

### Database Operations

```typescript
import { DatabaseService } from './src/services/database'

// Create code submission
const submissionId = await DatabaseService.createCodeSubmission({
  title: 'Binary Search Implementation',
  code_content: 'function binarySearch...',
  language: 'javascript',
  submission_type: 'analysis'
})

// Save analysis result
await DatabaseService.saveAnalysisResult({
  submission_id: submissionId,
  summary: 'Well-implemented binary search',
  score: 85,
  time_complexity: 'O(log n)',
  space_complexity: 'O(1)',
  bugs: [],
  optimizations: ['Add input validation']
})
```

## 🎯 Next Steps

1. **Test the Setup**: Run the application and test authentication flows
2. **Configure AI Services**: Set up Gemini and Tavus API keys
3. **Set up RevenueCat**: Configure subscription products and webhooks
4. **Customize**: Modify the schema and policies as needed for your use case
5. **Deploy**: Deploy your application with the Supabase backend

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [RevenueCat Documentation](https://docs.revenuecat.com)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)

## 🆘 Troubleshooting

### Common Issues

1. **RLS Policies**: Make sure RLS is enabled and policies are correctly configured
2. **Environment Variables**: Verify all required environment variables are set
3. **Migrations**: Run migrations in the correct order
4. **Storage Buckets**: Ensure buckets are created with correct policies
5. **Edge Functions**: Check function logs for deployment issues

### Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify your environment variables
3. Test API endpoints individually
4. Check the browser console for client-side errors

---

🎉 **Congratulations!** You now have a fully functional, secure, and scalable backend for your CodeSage platform!