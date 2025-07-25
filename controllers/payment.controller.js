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
      success_url: 'https://job-portal-swart-zeta.vercel.app/',//`${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      metadata: {
        bookingId: booking._id.toString(),
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Stripe webhook handler
export const stripeWebhook = (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Error message: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata.bookingId;

    Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'paid' }, { new: true })
      .then(updatedBooking => {
        console.log('Booking updated:', updatedBooking);
      })
      .catch(err => {
        console.error('Error updating booking:', err);
      });
  }

  res.json({ received: true });
};