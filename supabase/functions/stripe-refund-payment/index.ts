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
    const { payment_intent_id, reason = 'requested_by_customer' } = await req.json();

    // Validate required parameters
    if (!payment_intent_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: payment_intent_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🔄 Refunding payment:', payment_intent_id);

    // Get the booking associated with this PaymentIntent to verify ownership
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('stripe_payment_intent_id', payment_intent_id)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the user has permission to refund (either the client or admin)
    if (booking.client_id !== user.id) {
      // In a real app, you might also allow admins or the service provider to initiate refunds
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the PaymentIntent to check if it's been captured
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    let refund;
    if (paymentIntent.status === 'requires_capture') {
      // If payment hasn't been captured yet, cancel the PaymentIntent instead of refunding
      const canceledPaymentIntent = await stripe.paymentIntents.cancel(payment_intent_id);
      console.log('✅ Payment canceled (not captured):', canceledPaymentIntent.id);
      
      refund = {
        id: `canceled_${canceledPaymentIntent.id}`,
        amount: canceledPaymentIntent.amount,
        status: 'canceled',
        payment_intent: canceledPaymentIntent.id,
      };
    } else if (paymentIntent.status === 'succeeded') {
      // If payment has been captured, create a refund
      refund = await stripe.refunds.create({
        payment_intent: payment_intent_id,
        reason: reason,
        metadata: {
          booking_id: booking.id,
          refund_requested_by: user.id,
        },
      });
      console.log('✅ Refund created:', refund.id);
    } else {
      return new Response(
        JSON.stringify({ 
          error: `Cannot refund payment with status: ${paymentIntent.status}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update the booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Failed to update booking status after refund:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        refund_id: refund.id,
        amount: refund.amount / 100, // Convert back to dollars
        status: refund.status,
        payment_intent_id: payment_intent_id,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Payment refund error:', error);
    
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