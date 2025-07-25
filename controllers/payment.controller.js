import Stripe from 'stripe';
import Booking from '../models/booking.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create a checkout session
export const createCheckoutSession = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate('service');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!booking.service) {
      return res.status(404).json({ success: false, message: 'Associated service not found for this booking.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: booking.service ? booking.service.serviceName : 'Service',
            description: booking.description,
            },
            unit_amount: booking.totalPrice * 100, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000',//`${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      metadata: {
        bookingId: booking._id.toString(),
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

      const bookingId = session.metadata.bookingId;
      
      if (!bookingId) {
        console.error('No bookingId found in session metadata');
        return res.json({ received: true });
      }

      // Update the booking
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId, 
        { 
          paymentStatus: 'paid',
          $push: { paymentHistory: {
            amount: session.amount_total / 100, // Convert back to dollars
            currency: session.currency,
            paymentDate: new Date(),
            stripeSessionId: session.id
          }}
        }, 
        { new: true }
      );

      if (!updatedBooking) {
        console.error(`Booking not found: ${bookingId}`);
      } else {
        console.log(`✅ Booking ${bookingId} marked as paid`);
        // Here you could add email notification or other post-payment logic
      }
    } catch (err) {
      console.error('Error processing webhook:', err);
      // Don't return error to Stripe - they'll keep retrying
    }
  }

  res.json({ received: true });
};