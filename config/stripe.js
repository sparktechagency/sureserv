import stripe from 'stripe';

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

export default stripeClient;
