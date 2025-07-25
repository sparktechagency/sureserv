import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_KEY);

// Create Payment Intent
export const createPaymentIntent = async (amount, metadata) => {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: "usd",
    metadata,
    automatic_payment_methods: { enabled: true }
  });
};

// Webhook Handler
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === "payment_intent.succeeded") {
    const bookingId = event.data.object.metadata.booking_id;
    // Assuming you have a Booking model imported here
    // import Booking from '../models/Booking.js';
    // await Booking.findByIdAndUpdate(bookingId, { 
    //   paymentStatus: "paid",
    //   status: "confirmed"
    // });
  }

  res.json({ received: true });
};
