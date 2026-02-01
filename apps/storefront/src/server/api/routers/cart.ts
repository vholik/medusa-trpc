import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const cartRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        currencyCode: z.string().length(3).default("usd"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cart = await ctx.medusa.cart.createCarts(
        {
          currency_code: input.currencyCode
        },
      );

      return cart
    }),

  retrieve: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const cart = await ctx.medusa.cart.retrieveCart(input.id, {
        relations: ["items", 'shipping_address', 'billing_address'],
        select: ['total', 'subtotal', 'tax_total', 'discount_total']
      });

      return cart;
    }),

  addLineItem: publicProcedure
    .input(
      z.object({
        cartId: z.string(),
        productId: z.number(),
        quantity: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: (products, { eq }) => eq(products.id, input.productId),
      });

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Product with id ${input.productId} not found`,
        });
      }

      const item = await ctx.medusa.cart.addLineItems(input.cartId, [
        {
          quantity: input.quantity,
          title: product.name,
          unit_price: product.price,
        },
      ]);
      return item;
    }),

  updateLineItem: publicProcedure
    .input(
      z.object({
        cartId: z.string(),
        lineItemId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.medusa.cart.updateLineItems([{
        id: input.lineItemId,
        quantity: input.quantity,
      }]);
      return item;
    }),

  removeLineItem: publicProcedure
    .input(
      z.object({
        cartId: z.string(),
        lineItemId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.medusa.cart.deleteLineItems([input.lineItemId]);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.medusa.cart.deleteCarts([input.id]);
    }),
});
