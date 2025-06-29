-- This migration creates the trigger for new user creation
-- Only if it doesn't already exist

DO $$
BEGIN
  -- Check if the trigger already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    -- Create the trigger only if it doesn't exist
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profiles();
  END IF;
END
$$;