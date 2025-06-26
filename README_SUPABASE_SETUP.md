# Supabase Setup Instructions

## Getting Your Supabase Credentials

To fix the "Invalid API key" errors, you need to get your actual Supabase project credentials:

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

### Step 4: Restart Your Development Server
After updating the `.env` file:
1. Stop your development server (Ctrl+C)
2. Start it again with `npm run dev`

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

## Phone Authentication Setup

This project includes phone number authentication with country code selection. To enable SMS authentication:

1. In your Supabase dashboard, go to **Authentication** > **Settings**
2. Enable **Phone** provider
3. Configure your SMS provider (Twilio, etc.)
4. Update your authentication settings as needed

The `PhoneInput` and `CountryCodeSelector` components are ready to use for phone-based authentication.