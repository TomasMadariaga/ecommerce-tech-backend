export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/mercadopago-webhook',
      handler: 'order.mercadopagoWebhook',
      config: {
        auth: false,
      },
    },
  ],
};