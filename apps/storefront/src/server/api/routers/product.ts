import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { products } from "~/server/db/schema";

export const productRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().int().positive(),
        currencyCode: z.string().length(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(products).values({
        name: input.name,
        description: input.description,
        price: input.price,
        currencyCode: input.currencyCode,
      });
    }),
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.products.findMany({
      orderBy: (products, { desc }) => [desc(products.createdAt)],
    });
  }),
  retrieve: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: (products, { eq }) => eq(products.id, input.id),
      });
      return product ?? null;
    }),
});
