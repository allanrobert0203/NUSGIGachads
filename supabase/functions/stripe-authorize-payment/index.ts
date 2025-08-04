import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const {
      booking_id,
      total_amount,
      currency = 'sgd',
      service_provider_id,
      application_fee_amount
    } = await req.json();

    // Validate required parameters
    if (!booking_id || !total_amount || !service_provider_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: booking_id, total_amount, service_provider_id' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🔐 Authorizing payment for booking:', booking_id);
    console.log('💰 Amount:', total_amount, currency.toUpperCase());
    console.log('👤 Service provider:', service_provider_id);

    // Get the booking details to verify ownership
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('client_id', user.id)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the service provider's Stripe connected account ID
    // Note: You'll need to add this field to your services table or create a separate freelancer_profiles table
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('stripe_connected_account_id')
      .eq('user_id', service_provider_id)
      .single();

    if (serviceError || !service?.stripe_connected_account_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Service provider Stripe account not found. Please ensure the freelancer has completed their payment setup.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create PaymentIntent with manual capture (escrow)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total_amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      capture_method: 'manual', // This creates the escrow effect
      application_fee_amount: Math.round((application_fee_amount || 0) * 100), // Platform fee in cents
      transfer_data: {
        destination: service.stripe_connected_account_id,
      },
      metadata: {
        booking_id: booking_id,
        service_provider_id: service_provider_id,
        client_id: user.id,
      },
      description: `Payment for booking ${booking_id}`,
    });

    console.log('✅ PaymentIntent created:', paymentIntent.id);

    // Update the booking with the PaymentIntent ID
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        status: 'payment-authorized',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking_id);

    if (updateError) {
      console.error('Failed to update booking with PaymentIntent ID:', updateError);
      // Note: In production, you might want to cancel the PaymentIntent here
    }

    return new Response(
      JSON.stringify({
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert back to dollars
        currency: paymentIntent.currency,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Payment authorization error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});