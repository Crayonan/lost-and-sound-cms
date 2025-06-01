# Stripe Integration Guide

This guide shows you how to connect your frontend checkout button to the Stripe backend using the endpoints we've created.

## Available Endpoints

### 1. Create Order Endpoint
**URL:** `POST /api/create-order`

Creates an order in your system before initiating payment.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "1",
      "quantity": 2
    }
  ],
  "userId": "123", // Optional - for logged-in users
  "customerEmail": "customer@example.com" // Optional
}
```

**Response:**
```json
{
  "orderId": 456,
  "totalAmount": 2000,
  "currency": "usd",
  "status": "pending",
  "items": [
    {
      "product": 1,
      "quantity": 2,
      "price": 1000,
      "name": "Festival Ticket"
    }
  ]
}
```

### 2. Create Checkout Session Endpoint
**URL:** `POST /api/create-checkout-session`

Creates a Stripe Checkout session for payment processing.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "1",
      "quantity": 2
    }
  ],
  "orderId": "456", // Optional - links to your order
  "customerEmail": "customer@example.com", // Optional
  "successUrl": "https://yoursite.com/success", // Optional
  "cancelUrl": "https://yoursite.com/cancel" // Optional
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_...",
  "totalAmount": 2000
}
```

## Frontend Implementation Examples

### Option 1: Simple Checkout (Recommended)

This approach creates an order first, then initiates Stripe Checkout:

```javascript
// Frontend checkout function
async function handleCheckout(cartItems) {
  try {
    // Step 1: Create order in your system
    const orderResponse = await fetch('/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: cartItems, // [{ productId: "1", quantity: 2 }]
        userId: getCurrentUserId(), // Optional
        customerEmail: getCurrentUserEmail(), // Optional
      }),
    });

    if (!orderResponse.ok) {
      throw new Error('Failed to create order');
    }

    const order = await orderResponse.json();

    // Step 2: Create Stripe checkout session
    const checkoutResponse = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: cartItems,
        orderId: order.orderId.toString(),
        customerEmail: getCurrentUserEmail(),
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/checkout/cancel`,
      }),
    });

    if (!checkoutResponse.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { url } = await checkoutResponse.json();

    // Step 3: Redirect to Stripe Checkout
    window.location.href = url;

  } catch (error) {
    console.error('Checkout error:', error);
    alert('Checkout failed. Please try again.');
  }
}

// Example usage with a checkout button
document.getElementById('checkout-button').addEventListener('click', () => {
  const cartItems = [
    { productId: "1", quantity: 2 },
    { productId: "3", quantity: 1 }
  ];
  
  handleCheckout(cartItems);
});
```

### Option 2: Direct Checkout

This approach goes directly to Stripe Checkout without creating an order first:

```javascript
async function handleDirectCheckout(cartItems) {
  try {
    const checkoutResponse = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: cartItems,
        customerEmail: getCurrentUserEmail(),
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/checkout/cancel`,
      }),
    });

    if (!checkoutResponse.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { url } = await checkoutResponse.json();
    window.location.href = url;

  } catch (error) {
    console.error('Checkout error:', error);
    alert('Checkout failed. Please try again.');
  }
}
```

### Option 3: React/Next.js Example

```jsx
import { useState } from 'react';

export default function CheckoutButton({ cartItems }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      // Create order first
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          userId: user?.id,
          customerEmail: user?.email,
        }),
      });

      const order = await orderRes.json();

      // Create checkout session
      const checkoutRes = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          orderId: order.orderId.toString(),
          customerEmail: user?.email,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/cancel`,
        }),
      });

      const { url } = await checkoutRes.json();
      window.location.href = url;

    } catch (error) {
      console.error('Checkout failed:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCheckout} 
      disabled={loading || cartItems.length === 0}
      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Processing...' : `Checkout ($${getTotalPrice()})`}
    </button>
  );
}
```

## Success/Cancel Pages

Create these pages to handle the checkout result:

### Success Page (`/checkout/success`)
```javascript
// Get session_id from URL params
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session_id');

if (sessionId) {
  // Optionally verify the session or show order details
  console.log('Payment successful! Session ID:', sessionId);
  // Show success message, order confirmation, etc.
}
```

### Cancel Page (`/checkout/cancel`)
```javascript
// Handle cancelled checkout
console.log('Checkout was cancelled');
// Show message, redirect back to cart, etc.
```

## Webhook Handling

Your webhook is already configured in `payload.config.ts` to handle:

- `checkout.session.completed` - Updates order status to 'paid'
- `payment_intent.succeeded` - Logs successful payment
- `payment_intent.payment_failed` - Logs failed payment

The webhook automatically updates your order status when payment is completed.

## Testing

1. **Create a test product** in your Payload admin panel
2. **Use your checkout button** with the product ID
3. **Use Stripe test cards** for testing:
   - Success: `4242424242424242`
   - Decline: `4000000000000002`

## Environment Variables

Make sure these are set in your `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3001
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
```

## Error Handling

The endpoints include comprehensive error handling for:
- Invalid product IDs
- Insufficient stock
- Missing Stripe price configuration
- Network errors

Always wrap your frontend calls in try-catch blocks and provide user feedback.

## Security Notes

- Never expose your Stripe secret key on the frontend
- Always validate data on the server side
- Use HTTPS in production
- Implement proper authentication for user-specific operations

## Next Steps

1. Implement the frontend code using one of the examples above
2. Test with Stripe test cards
3. Set up your success/cancel pages
4. Configure your webhook endpoint in Stripe dashboard
5. Deploy and test in production with live keys
