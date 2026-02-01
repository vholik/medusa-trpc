"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

const CART_ID_KEY = "cartId";

export default function ProductsPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [cartId, setCartId] = useState<string | null>(null);

  useEffect(() => {
    const storedCartId = localStorage.getItem(CART_ID_KEY);
    if (storedCartId) {
      setCartId(storedCartId);
    }
  }, []);

  const utils = api.useUtils();
  const products = api.product.list.useQuery();

  const cart = api.cart.retrieve.useQuery(
    { id: cartId! },
    { enabled: !!cartId }
  );

  const createCart = api.cart.create.useMutation({
    onSuccess: (data) => {
      const newCartId = data.id;
      localStorage.setItem(CART_ID_KEY, newCartId);
      setCartId(newCartId);
    },
  });

  const addLineItem = api.cart.addLineItem.useMutation({
    onSuccess: () => {
      void utils.cart.retrieve.invalidate();
    },
  });

  const createProduct = api.product.create.useMutation({
    onSuccess: () => {
      void utils.product.list.invalidate();
      setName("");
      setDescription("");
      setPrice("");
      setCurrencyCode("USD");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    createProduct.mutate({
      name,
      description: description || undefined,
      price: Math.round(parseFloat(price) * 100),
      currencyCode,
    });
  };

  const handleAddToCart = async (productId: number) => {
    let currentCartId = cartId;

    if (!currentCartId) {
      const newCart = await createCart.mutateAsync({ currencyCode: "usd" });
      currentCartId = newCart.id;
    }

    addLineItem.mutate({
      cartId: currentCartId,
      productId,
      quantity: 1,
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(price / 100);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Products</h1>

        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Cart</h2>
          {!cartId ? (
            <p className="text-gray-500">No cart yet. Add a product to create one.</p>
          ) : cart.isLoading ? (
            <p className="text-gray-500">Loading cart...</p>
          ) : (
            <pre className="overflow-auto rounded bg-gray-100 p-4 text-sm text-gray-800">
              {JSON.stringify(cart.data, null, 2)}
            </pre>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-lg bg-white p-6 shadow"
        >
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Create Product
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Product name"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Optional description"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={createProduct.isPending}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {createProduct.isPending ? "Creating..." : "Create Product"}
          </button>
        </form>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Product List
          </h2>
          {products.isLoading ? (
            <p className="text-gray-500">Loading products...</p>
          ) : products.data?.length === 0 ? (
            <p className="text-gray-500">No products yet. Create one above!</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {products.data?.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-500">
                        {product.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatPrice(product.price, product.currencyCode)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={addLineItem.isPending || createCart.isPending}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {addLineItem.isPending ? "Adding..." : "Add to cart"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
