# medusa-trpc

A Proof of Concept (POC) demonstrating how to use Medusa modules outside of the main Medusa application in a serverless/edge environment.

## Overview

This monorepo contains:

- **`packages/medusa-serverless`** - A package that initializes Medusa modules for use in serverless environments
- **`apps/storefront`** - A Next.js storefront demonstrating the integration with tRPC

## packages/medusa-serverless

A lightweight package for initializing Medusa modules (Cart, Product, etc.) outside of the Medusa framework. This allows you to use Medusa's powerful commerce modules in any Node.js environment - tRPC, Hono.js, Express, or serverless functions.

### Installation

```bash
bun add @rigby-software-house/medusa-serverless
```

### Usage

```typescript
import { initialize } from "@rigby-software-house/medusa-serverless";
import { Modules } from "@medusajs/framework/utils";

const medusa = await initialize({
  dbConnectionString: "postgres://...",
  modules: [Modules.CART, Modules.PRODUCT],
});

// Type-safe access to modules
const cart = await medusa.cart.createCarts({ currency_code: "usd" });
```

### Type Inference

The `initialize` function uses `InferLoadedModules` type to provide type-safe access to only the modules you've loaded:

```typescript
// Only cart module loaded - medusa.product would be a type error
const medusa = await initialize({
  dbConnectionString: "...",
  modules: [Modules.CART],
});

medusa.cart; // ICartModuleService
medusa.product; // Type error - not loaded
```

### Supported Modules

- `Modules.CART` - Cart management
- `Modules.PRODUCT` - Product catalog

## apps/storefront

A Next.js application demonstrating the integration of `medusa-serverless` with tRPC.

### tRPC Context Integration

The Medusa modules are injected into the tRPC context:

```typescript
// src/server/api/trpc.ts
import { initialize } from "@rigby-software-house/medusa-serverless";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const medusa = await initialize({
    dbConnectionString: env.DATABASE_URL,
    modules: ["cart"],
  });

  return {
    db,
    medusa,
    ...opts,
  };
};
```

### Using in tRPC Routers

Access Medusa services through the context in your routers:

```typescript
// src/server/api/routers/cart.ts
export const cartRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ currencyCode: z.string().length(3).default("usd") }))
    .mutation(async ({ ctx, input }) => {
      const cart = await ctx.medusa.cart.createCarts({
        currency_code: input.currencyCode,
      });
      return cart;
    }),

  retrieve: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.medusa.cart.retrieveCart(input.id, {
        relations: ["items", "shipping_address", "billing_address"],
      });
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
      // Combine with your own database
      const product = await ctx.db.query.products.findFirst({
        where: (products, { eq }) => eq(products.id, input.productId),
      });

      return ctx.medusa.cart.addLineItems(input.cartId, [
        {
          quantity: input.quantity,
          title: product.name,
          unit_price: product.price,
        },
      ]);
    }),
});
```

## Getting Started

### Prerequisites

- Node.js 18+
- Bun
- PostgreSQL

### Setup

1. Clone the repository:

```bash
git clone https://github.com/vholik/medusa-trpc.git
cd medusa-trpc
```

2. Install dependencies:

```bash
bun install
```

3. Create a PostgreSQL database:

```bash
psql -c "CREATE DATABASE storefront;"
```

4. Set up environment variables in `apps/storefront/.env`:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/storefront"
```

5. Run database migrations:

```bash
cd apps/storefront
bun drizzle-kit push
```

6. Start the development server:

```bash
bun dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Storefront                    │
├─────────────────────────────────────────────────────────┤
│                      tRPC Router                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ cartRouter  │  │productRouter│  │   ...       │     │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘     │
│         │                │                              │
│         ▼                ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │              tRPC Context                        │   │
│  │  ┌─────────┐  ┌──────────────────────────────┐  │   │
│  │  │   db    │  │  medusa (medusa-serverless)  │  │   │
│  │  │(Drizzle)│  │  └── cart: ICartModuleService│  │   │
│  │  └────┬────┘  └──────────────┬───────────────┘  │   │
│  └───────┼──────────────────────┼──────────────────┘   │
│          │                      │                       │
└──────────┼──────────────────────┼───────────────────────┘
           │                      │
           ▼                      ▼
    ┌─────────────────────────────────────┐
    │            PostgreSQL               │
    │  ┌───────────┐  ┌───────────────┐  │
    │  │  Drizzle  │  │    Medusa     │  │
    │  │  Tables   │  │    Tables     │  │
    │  └───────────┘  └───────────────┘  │
    └─────────────────────────────────────┘
```

## License

MIT
