export async function handleMercadoPagoWebhook(ctx) {
  try {

    const { resource } = ctx.request.body;

    if (!resource) {
      ctx.body = { received: true };
      return;
    }

    const mpRes = await fetch(resource, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
    });
    const mpOrder = await mpRes.json();

    // @ts-ignore
    const orderDocumentId: string = mpOrder.external_reference;

    if (!orderDocumentId) {
      ctx.body = { received: true };
      return;
    }

    const orders = await strapi.entityService.findMany("api::order.order", {
      // @ts-ignore
      filters: { documentId: orderDocumentId },
      limit: 1,
    });

    if (!orders || orders.length === 0) {
      ctx.body = { received: true };
      return;
    }

    const myOrder = orders[0];

    await strapi.entityService.update("api::order.order", myOrder.id, {
      data: {
        orderStatus: "approved",
        // @ts-ignore
        paymentId: mpOrder.payments?.[0]?.id?.toString() || null,
      },
    });

    ctx.body = { received: true };
  } catch (error) {
    console.error("❌ Error:", error.message);
    ctx.body = { received: true };
  }
}
