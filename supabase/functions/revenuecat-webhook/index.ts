import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RevenueCatWebhookEvent {
  event_type: string
  event_id: string
  app_user_id: string
  subscriber: any
  product_id?: string
  subscription_id?: string
  transaction_id?: string
  expiration_date?: string
  price?: number
  currency?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify webhook signature (RevenueCat webhook secret)
    const signature = req.headers.get('authorization')
    const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')
    
    if (!signature || !webhookSecret) {
      console.error('Missing webhook signature or secret')
      return new Response('Unauthorized', { status: 401 })
    }

    // Parse webhook payload
    const payload: RevenueCatWebhookEvent = await req.json()
    
    console.log('Received RevenueCat webhook:', {
      event_type: payload.event_type,
      event_id: payload.event_id,
      app_user_id: payload.app_user_id
    })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Process the webhook using the database function
    const { error } = await supabase.rpc('process_revenuecat_webhook', {
      p_event_type: payload.event_type,
      p_event_id: payload.event_id,
      p_event_data: payload
    })

    if (error) {
      console.error('Error processing webhook:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to process webhook' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Successfully processed webhook:', payload.event_id)

    return new Response(
      JSON.stringify({ success: true, event_id: payload.event_id }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})