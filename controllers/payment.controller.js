import Stripe from 'stripe';
import Order from '../models/order.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create a checkout session
export const createCheckoutSession = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId).populate({
      path: 'bookings',
      populate: {
        path: 'services.service'
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const serviceNames = order.bookings.map(b => b.services.map(s => s.service.serviceName).join(', ')).join('; ');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Order for ${serviceNames}`,
              description: `Order #${order._id}`,
            },
            unit_amount: order.totalAmount * 100, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000',//`${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      metadata: {
        orderId: order._id.toString(),
      },
    });

    res.status(200).json({ sessionId: session.id , url: session.url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Stripe webhook handler
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    try {
      const session = event.data.object;
      
      // Verify the payment was successful
      if (session.payment_status !== 'paid') {
        console.warn(`Payment not completed for session: ${session.id}`);
        return res.json({ received: true });
      }

      const orderId = session.metadata.orderId;
      
      if (!orderId) {
        console.error('No orderId found in session metadata');
        return res.json({ received: true });
      }

      // Update the order
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId, 
        { 
          paymentStatus: 'paid',
          orderStatus: 'processing',
        }, 
        { new: true }
      );

      if (!updatedOrder) {
        console.error(`Order not found: ${orderId}`);
      } else {
        console.log(`✅ Order ${orderId} marked as paid`);
        // Here you could add email notification or other post-payment logic
      }
    } catch (err) {
      console.error('Error processing webhook:', err);
      // Don't return error to Stripe - they'll keep retrying
    }
  }

  res.json({ received: true });
};