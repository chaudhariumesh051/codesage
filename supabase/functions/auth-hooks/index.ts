import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuthHookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: any
  old_record?: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: AuthHookPayload = await req.json()
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different auth events
    switch (payload.type) {
      case 'INSERT':
        await handleUserSignup(supabase, payload.record)
        break
      case 'UPDATE':
        await handleUserUpdate(supabase, payload.record, payload.old_record)
        break
      case 'DELETE':
        await handleUserDeletion(supabase, payload.old_record)
        break
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Auth hook error:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleUserSignup(supabase: any, user: any) {
  console.log('Handling user signup:', user.id)
  
  // Log security event
  await supabase
    .from('user_security_logs')
    .insert({
      user_id: user.id,
      email: user.email,
      event_type: 'login_success',
      event_description: 'User account created',
      ip_address: user.last_sign_in_at ? '0.0.0.0' : null // Would get from request in real implementation
    })

  // Send welcome email (would integrate with email service)
  console.log('Would send welcome email to:', user.email)
}

async function handleUserUpdate(supabase: any, user: any, oldUser: any) {
  console.log('Handling user update:', user.id)
  
  // Check for email verification
  if (!oldUser.email_confirmed_at && user.email_confirmed_at) {
    await supabase
      .from('user_security_logs')
      .insert({
        user_id: user.id,
        email: user.email,
        event_type: 'email_verified',
        event_description: 'Email address verified'
      })
  }

  // Check for password reset
  if (user.recovery_sent_at && user.recovery_sent_at !== oldUser.recovery_sent_at) {
    await supabase
      .from('user_security_logs')
      .insert({
        user_id: user.id,
        email: user.email,
        event_type: 'password_reset_requested',
        event_description: 'Password reset requested'
      })
  }
}

async function handleUserDeletion(supabase: any, user: any) {
  console.log('Handling user deletion:', user.id)
  
  // Clean up user data (handled by CASCADE in database)
  // Log the deletion
  await supabase
    .from('user_security_logs')
    .insert({
      user_id: null,
      email: user.email,
      event_type: 'account_deleted',
      event_description: 'User account deleted'
    })
}