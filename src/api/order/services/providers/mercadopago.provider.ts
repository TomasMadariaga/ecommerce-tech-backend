// @ts-ignore
const { MercadoPagoConfig, Preference } = require("mercadopago");

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

export class MercadoPagoProvider {
  async createPayment(order: any, lineItems: any[]) {
    const preferenceClient = new Preference(mpClient);
    const usdToArs = await this.getExchangeRate();

    const preference = await preferenceClient.create({
      body: {
        items: lineItems.map((item) => ({
          title: `${item.brand} ${item.model}`,
          description: item.description,
          quantity: item.quantity || 1,
          currency_id: "AR",
          unit_price: Number(item.price) * usdToArs,
          picture_url: item.images?.[0]?.url
            ? process.env.API_URL + item.images[0].url
            : undefined,
        })),
        payer: {
          name: order.user?.username || "John Doe",
          email: order.user?.email || "johndoe@gmail.com",
        },
        back_urls: {
          success: "https://google.com", // PRUEBA CON URL HTTPS
          failure: process.env.CLIENT_URL + "/cart?failed=true",
          pending: process.env.CLIENT_URL + "/pending",
        },
        auto_return: "approved",
        notification_url:
          process.env.API_URL + "/api/orders/mercadopago-webhook",
        external_reference: order.documentId,
        payment_methods: {
          installments: 12,
        },
      },
    });

    await strapi.entityService.update("api::order.order", order.id, {
      data: { mpPreferenceId: preference.id },
    });

    return {
      success: true,
      provider: "mercadopago",
      orderId: order.documentId,
      preferenceId: preference.id,
      initPoint: preference.sandbox_init_point,
    };
  }

  private async getExchangeRate(): Promise<number> {
  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${process.env.USD_CONVERTER_API_KEY}/latest/USD`
    );
    const data = await response.json();
    //@ts-ignore
    return data.conversion_rates.ARS;
    
  } catch (error) {
    console.error("Error obteniendo tipo de cambio, usando fallback:", error);
    return process.env.USD_TO_ARS_FALLBACK 
      ? Number(process.env.USD_TO_ARS_FALLBACK) 
      : 1000;
  }
}
}

