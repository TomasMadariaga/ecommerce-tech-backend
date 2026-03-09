const stripe = require("stripe")(process.env.STRIPE_KEY);

export class StripeProvider {
  async createPayment(order: any, lineItems: any[]) {
    const stripeLineItems = lineItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.brand} ${item.model}`,
          images: item.images ? [item.images[0]?.url] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      shipping_address_collection: {
        allowed_countries: ["US", "ES", "MX", "AR"],
      },
      payment_method_types: ["card"],
      mode: "payment",
      success_url:
        process.env.CLIENT_URL + "/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: process.env.CLIENT_URL + "/cart?canceled=true",
      line_items: stripeLineItems,
    });

    await strapi.entityService.update("api::order.order", order.id, {
      data: {
        stripeSessionId: session.id,
      },
    });

    return {
      success: true,
      provider: "stripe",
      orderId: order.id,
      stripeSession: session,
      url: session.url,
    };
  }
}
