const stripe = require("stripe")(process.env.STRIPE_KEY);

export async function handleStripeWebhook(ctx) {
  const sig = ctx.request.headers["stripe-signature"];

  const rawBody = ctx.request.body[Symbol.for("unparsedBody")];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.log("❌ Error de firma Stripe:", err.message);
    ctx.status = 400;
    return `Webhook Error: ${err.message}`;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const stripeSessionId = session.id;

    const orders = await strapi.entityService.findMany("api::order.order", {
      filters: { stripeSessionId },
    });

    if (orders.length > 0) {
      const order = orders[0];

      await strapi.entityService.update("api::order.order", order.id, {
        data: {
          orderStatus: "approved",
          paymentId: session.payment_intent,
        },
      });
    }
  }

  ctx.body = { received: true };
}
