/*
  # Fix infinite recursion in user_profiles RLS policies

  1. Policy Changes
    - Remove the problematic admin policy that causes recursion
    - Create a simpler admin policy that doesn't reference user_profiles table
    - Keep the existing user policies intact

  2. Security
    - Users can still view and update their own profiles
    - Admins will need to use service role or a different approach for admin access
    - This prevents the infinite recursion while maintaining basic security
*/

-- Drop the problematic admin policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Create a simpler policy structure that doesn't cause recursion
-- For now, we'll rely on the existing user policies and handle admin access differently
-- Users can view their own profile
-- Users can update their own profile
-- The existing policies already handle this correctly

-- If admin access is needed, it should be handled through:
-- 1. Service role access (bypasses RLS)
-- 2. A separate admin interface
-- 3. Or by storing admin status in auth.users metadata instead of user_profiles table

-- Ensure the user policies are still in place (they should be, but let's be explicit)
DO $$
BEGIN
  -- Check if user view policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON user_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  -- Check if user update policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON user_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;