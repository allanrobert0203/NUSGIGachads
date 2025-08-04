import { useState } from 'react';

export interface StripeCheckoutOptions {
  priceId: string;
  mode: 'payment' | 'subscription';
  successUrl?: string;
  cancelUrl?: string;
  bookingId?: string;
  totalAmount?: number;
  currency?: string;
  serviceProviderId?: string;
}

export interface PaymentAuthorizationOptions {
  bookingId: string;
  totalAmount: number;
  currency: string;
  serviceProviderId: string;
  applicationFeeAmount?: number;
}

export interface UserSubscription {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export interface UserOrder {
  customer_id: string;
  order_id: number;
  checkout_session_id: string;
  payment_intent_id: string;
  amount_subtotal: number;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_date: string;
}

export interface PaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  status: string;
}

export function useStripe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = async (options: StripeCheckoutOptions): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);

      // For now, return null since Supabase is not configured
      console.warn('Stripe checkout not available - Supabase not configured');
      return null;

      const defaultSuccessUrl = `${window.location.origin}/payment-success`;
      const defaultCancelUrl = `${window.location.origin}/payment-cancel`;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Stripe checkout error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getUserSubscription = async (): Promise<UserSubscription | null> => {
    try {
      setError(null);
      
      // Return null since Supabase is not configured
      console.warn('Subscription data not available - Supabase not configured');
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscription';
      setError(errorMessage);
      console.error('Error fetching subscription:', err);
      return null;
    }
  };

  const getUserOrders = async (): Promise<UserOrder[]> => {
    try {
      setError(null);
      
      // Return empty array since Supabase is not configured
      console.warn('Order data not available - Supabase not configured');
      return [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
      console.error('Error fetching orders:', err);
      return [];
    }
  };

  const authorizePayment = async (options: PaymentAuthorizationOptions): Promise<PaymentIntentResult | null> => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      if (!supabase) {
        console.warn('Payment authorization not available - Supabase not configured');
        setError('Payment system not configured');
        return null;
      }

      console.log('🔐 Authorizing payment for booking:', options.bookingId);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/stripe-authorize-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: options.bookingId,
          total_amount: options.totalAmount,
          currency: options.currency || 'sgd',
          service_provider_id: options.serviceProviderId,
          application_fee_amount: options.applicationFeeAmount || Math.round(options.totalAmount * 0.05), // 5% platform fee
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to authorize payment');
      }

      const result = await response.json();
      console.log('✅ Payment authorized successfully:', result.payment_intent_id);
      
      return {
        paymentIntentId: result.payment_intent_id,
        clientSecret: result.client_secret,
        status: result.status,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment authorization failed';
      setError(errorMessage);
      console.error('Payment authorization error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const capturePayment = async (paymentIntentId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      if (!supabase) {
        console.warn('Payment capture not available - Supabase not configured');
        setError('Payment system not configured');
        return false;
      }

      console.log('💰 Capturing payment:', paymentIntentId);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/stripe-capture-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to capture payment');
      }

      console.log('✅ Payment captured successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment capture failed';
      setError(errorMessage);
      console.error('Payment capture error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refundPayment = async (paymentIntentId: string, reason?: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is configured
      if (!supabase) {
        console.warn('Payment refund not available - Supabase not configured');
        setError('Payment system not configured');
        return false;
      }

      console.log('🔄 Refunding payment:', paymentIntentId);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/stripe-refund-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
          reason: reason || 'requested_by_customer',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refund payment');
      }

      console.log('✅ Payment refunded successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment refund failed';
      setError(errorMessage);
      console.error('Payment refund error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    getUserSubscription,
    getUserOrders,
    authorizePayment,
    capturePayment,
    refundPayment,
    loading,
    error,
  };
}