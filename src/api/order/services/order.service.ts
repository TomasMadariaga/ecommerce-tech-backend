import { MercadoPagoProvider } from "./providers/mercadopago.provider";
import { StripeProvider } from "./providers/stripe.provider";

export class OrderService {
  private providers: any = {
    stripe: new StripeProvider(),
    mercadopago: new MercadoPagoProvider(),
  };

  async createOrderWithPayment(data: any, userId: number) {
    const { products, paymentMethod } = data;

    const lineItems = await this.validateAndGetProducts(products);

    const totalAmount = lineItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0,
    );

    const order = await strapi.entityService.create("api::order.order", {
        data: {
            products: lineItems.map((item) => ({
                documentId: item.documentId,
                quantity: item.quantity || 1,
                model: item.model,
                brand: item.brand,
                price: item.price,
                image: item.image
            })),
            total: totalAmount,
            orderStatus: "pending",
            paymentMethod,
            user: userId
        }
    });

    const provider = this.providers[paymentMethod];
    if (!provider) {
        throw new Error(`Provider ${paymentMethod} no soportado`);
    }

    const paymentResult = await provider.createPayment(order, lineItems);

    return {
        order,
        payment: paymentResult
    }
  }

  private async validateAndGetProducts(products: any[]) {
    return await Promise.all(
      products.map(async (product) => {
        const item = await strapi
          .service("api::product.product")
          .findOne(product.documentId);

        if (!item) {
          throw new Error(`Product with id ${product.id} not found`);
        }

        return {
          ...item,
          image: product.images[0]?.url,
          quantity: product.quantity || 1,
          totalPrice: item.price * (product.quantity || 1),
        };
      }),
    );
  }
}
