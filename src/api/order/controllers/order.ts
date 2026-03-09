// import { OrderService } from "../services/order.service";
// import { StripeProvider } from "../services/providers/stripe.provider";

import { handleMercadoPagoWebhook } from "../webhooks/mercadopago.webhook";
import { handleStripeWebhook } from "../webhooks/stripe.webhook";

// @ts-ignore
const stripe = require("stripe")(process.env.STRIPE_KEY);
// const { MercadoPagoConfig, Preference } = require("mercadopago");
const { factories } = require("@strapi/strapi");
const { OrderService } = require("../services/order.service");

const orderService = new OrderService();

// export const mpClient = new MercadoPagoConfig({
//   accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
// });

module.exports = factories.createCoreController(
  "api::order.order",
  ({ strapi }) => ({
    async create(ctx) {
      try {
        // const { products, paymentMethod = "stripe" } = ctx.request.body;

        // if (!products || products.length === 0) {
        //   return ctx.badRequest("No products provided");
        // }

        const userId = ctx.state.user?.id;

        const result = await orderService.createOrderWithPayment(
          ctx.request.body,
          userId,
        );

        //     const lineItems = await Promise.all(
        //       products.map(async (product) => {
        //         const item = await strapi
        //           .service("api::product.product")
        //           .findOne(product.documentId);

        //         if (!item) {
        //           throw new Error(`Product with id ${product.id} not found`);
        //         }

        //         return {
        //           ...item,
        //           image: product.images[0]?.url,
        //           quantity: product.quantity || 1,
        //           totalPrice: item.price * (product.quantity || 1),
        //         };
        //       }),
        //     );

        //     const totalAmount = lineItems.reduce(
        //       (sum, item) => sum + item.totalPrice,
        //       0,
        //     );

        //     let paymentResult;

        //     const order = await strapi.entityService.create("api::order.order", {
        //       data: {
        //         products: lineItems.map((item) => ({
        //           documentId: item.documentId,
        //           quantity: item.quantity || 1,
        //           model: item.model,
        //           brand: item.brand,
        //           price: item.price,
        //           image: item.image
        //         })),
        //         total: totalAmount,
        //         orderStatus: "pending",
        //         paymentMethod,
        //         user: userId,
        //       },
        //     });

        //     const orderDocumentId = order.documentId;
        //     const orderId = order.id;

        //     if (paymentMethod === "mercadopago") {
        //       const preferenceClient = new Preference(mpClient);

        //       const preference = await preferenceClient.create({
        //         body: {
        //           items: lineItems.map((item) => ({
        //             title: `${item.brand} ${item.model}`,
        //             description: item.description,
        //             quantity: item.quantity || 1,
        //             currency_id: getCurrencyForCountry(process.env.COUNTRY || "AR"),
        //             unit_price: Number(item.price),
        //             picture_url: item.images?.[0]?.url
        //               ? process.env.API_URL + item.images[0].url
        //               : undefined,
        //           })),
        //           payer: {
        //             name: ctx.state.user?.username || "JohnDoe",
        //             email: ctx.state.user?.email || "johndoe@email.com",
        //           },
        //           back_urls: {
        //             success: "https://google.com/",
        //             failure: process.env.CLIENT_URL + "/cart?failed=true",
        //             pending: process.env.CLIENT_URL + "/pending",
        //           },
        //           auto_return: "approved",
        //           notification_url:
        //             process.env.API_URL + "/api/orders/mercadopago-webhook",
        //           external_reference: orderDocumentId,
        //           payment_methods: {
        //             installments: 12,
        //           },
        //         },
        //       });

        //       await strapi.entityService.update("api::order.order", orderId, {
        //         data: {
        //           mpPreferenceId: preference.id,
        //         },
        //       });

        //       return {
        //         success: true,
        //         provider: "mercadopago",
        //         orderId: orderDocumentId,
        //         preferenceId: preference.id,
        //         initPoint: preference.sandbox_init_point,
        //       };
        //     }

        //     const stripeLineItems = lineItems.map((item) => ({
        //       price_data: {
        //         currency: "usd",
        //         product_data: {
        //           name: `${item.brand} ${item.model}`,
        //           images: item.images ? [item.images[0]?.url] : [],
        //         },
        //         unit_amount: Math.round(item.price * 100),
        //       },
        //       quantity: item.quantity || 1,
        //     }));

        //     const session = await stripe.checkout.sessions.create({
        //       shipping_address_collection: {
        //         allowed_countries: ["US", "ES", "MX", "AR"],
        //       },
        //       payment_method_types: ["card"],
        //       mode: "payment",
        //       success_url:
        //         process.env.CLIENT_URL +
        //         "/success?session_id={CHECKOUT_SESSION_ID}",
        //       cancel_url: process.env.CLIENT_URL + "/cart?canceled=true",
        //       line_items: stripeLineItems,
        //     });

        //     await strapi.entityService.update("api::order.order", orderId, {
        //       data: {
        //         stripeSessionId: session.id,
        //       },
        //     });

        //     return {
        //       success: true,
        //       provider: paymentMethod,
        //       orderId: order.id,
        //       ...(paymentMethod === "mercadopago"
        //         ? {
        //             preferenceId: Preference.id,
        //             initPoint: Preference.sandbox_init_point,
        //             render: {
        //               container: ".mercadopago-button-container",
        //               label: "Pagar con Mercado Pago",
        //             },
        //           }
        //         : {
        //             stripeSession: session,
        //             url: session.url,
        //           }),
        //     };
        return {
          success: true,
          ...result.payment,
          orderId: result.order.documentId,
        };
      } catch (error) {
        console.error("❌ Error en checkout:", error);

        ctx.response.status = 500;
        return {
          error: true,
          message: error.message,
          details: error.toString(),
        };
      }
    },

    // async getMercadoPagoStatus(ctx) {
    //   try {
    //     const { preferenceId } = ctx.params;

    //     if (!preferenceId) {
    //       return ctx.badRequest("Preference ID required");
    //     }

    //     const preferenceClient = new Preference(mpClient);
    //     const preference = await preferenceClient.get({ preferenceId });

    //     return {
    //       success: true,
    //       status: preference.body.status,
    //       payments: preference.body.payments,
    //     };
    //   } catch (error) {
    //     console.error("Error obteniendo estado de MP:", error);
    //     ctx.response.status = 500;
    //     return { error: true, message: error.message };
    //   }
    // },

    async mercadopagoWebhook(ctx) {
      await handleMercadoPagoWebhook(ctx);
      // try {
      //   console.log(
      //     "📢 Webhook MP recibido:",
      //     JSON.stringify(ctx.request.body, null, 2),
      //   );
      //   const { type, data } = ctx.request.body;
      //   console.log("Tipo de notificación:", type);
      //   console.log("Data:", data);

      //   if (type === "payment") {
      //     const { Payment } = require("mercadopago");
      //     const paymentClient = new Payment(mpClient);

      //     const payment = await paymentClient.get({ id: data.id });
      //     const paymentData = payment;

      //     if (paymentData.status === "approved") {
      //       const orderDocumentId = paymentData.external_reference;

      //       await strapi.entityService.update(
      //         "api::order.order",
      //         orderDocumentId,
      //         {
      //           data: {
      //             orderStatus: "approved",
      //             paymentId: payment.id.toString(),
      //           },
      //         },
      //       );
      //     }
      //   }

      //   ctx.body = { received: true };
      // } catch (error) {
      //   console.error("Error en webhook MP:", error);
      //   ctx.response.status = 500;
      // }
    },

    async stripeWebhook(ctx) {
      await handleStripeWebhook(ctx);
      // const sig = ctx.request.headers["stripe-signature"];

      // const rawBody = ctx.request.body[Symbol.for("unparsedBody")];

      // let event;

      // try {
      //   event = stripe.webhooks.constructEvent(
      //     rawBody,
      //     sig,
      //     process.env.STRIPE_WEBHOOK_SECRET,
      //   );
      // } catch (err) {
      //   console.log("❌ Error de firma Stripe:", err.message);
      //   ctx.status = 400;
      //   return `Webhook Error: ${err.message}`;
      // }

      // if (event.type === "checkout.session.completed") {
      //   const session = event.data.object;

      //   const stripeSessionId = session.id;

      //   const orders = await strapi.entityService.findMany("api::order.order", {
      //     filters: { stripeSessionId },
      //   });

      //   if (orders.length > 0) {
      //     const order = orders[0];

      //     await strapi.entityService.update("api::order.order", order.id, {
      //       data: {
      //         orderStatus: "approved",
      //         paymentId: session.payment_intent,
      //       },
      //     });
      //   }
      // }

      // ctx.body = { received: true };
    },
  }),
);

function getCurrencyForCountry(country) {
  const currencies = {
    AR: "ARS",
    BR: "BRL",
    MX: "MXN",
    CO: "COP",
    CL: "CLP",
    PE: "PEN",
    UY: "UYU",
  };
  return currencies[country] || "ARS";
}
