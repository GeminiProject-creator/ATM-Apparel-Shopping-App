import { Router, type IRouter, type Request, type Response } from "express";
import { shopifyStorefrontRequest } from "../lib/shopifyStorefrontClient";

type Money = { amount: string; currencyCode: string };
type ShopifyImage = { url: string; altText: string | null };
type SelectedOption = { name: string; value: string };
type RawVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: SelectedOption[];
};
type RawProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  availableForSale: boolean;
  featuredImage: ShopifyImage | null;
  images: { nodes: ShopifyImage[] };
  variants: { nodes: RawVariant[] };
};
type Product = Omit<RawProduct, "images" | "variants"> & {
  images: ShopifyImage[];
  variants: RawVariant[];
};
type RawCartLine = {
  id: string;
  quantity: number;
  merchandise: RawVariant & {
    product: {
      id: string;
      handle: string;
      title: string;
      featuredImage: ShopifyImage | null;
    };
  };
};
type RawCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: { nodes: RawCartLine[] };
  cost: { subtotalAmount: Money; totalAmount: Money };
};
type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: Array<{
    id: string;
    quantity: number;
    merchandiseId: string;
    variantTitle: string;
    selectedOptions: SelectedOption[];
    price: Money;
    availableForSale: boolean;
    productId: string;
    productHandle: string;
    productTitle: string;
    image: ShopifyImage | null;
  }>;
  subtotal: Money;
  total: Money;
};
type ShopifyUserError = { message: string };

const router: IRouter = Router();

const PRODUCT_FIELDS = `
  id
  handle
  title
  description
  productType
  tags
  availableForSale
  featuredImage { url altText }
  images(first: 8) { nodes { url altText } }
  variants(first: 100) {
    nodes {
      id
      title
      availableForSale
      price { amount currencyCode }
      compareAtPrice { amount currencyCode }
      selectedOptions { name value }
    }
  }
`;

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  lines(first: 50) {
    nodes {
      id
      quantity
      merchandise {
        ... on ProductVariant {
          id
          title
          availableForSale
          price { amount currencyCode }
          selectedOptions { name value }
          product {
            id
            handle
            title
            featuredImage { url altText }
          }
        }
      }
    }
  }
  cost {
    subtotalAmount { amount currencyCode }
    totalAmount { amount currencyCode }
  }
`;

function normalizeProduct(product: RawProduct): Product {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    productType: product.productType,
    tags: product.tags,
    availableForSale: product.availableForSale,
    featuredImage: product.featuredImage,
    images: product.images.nodes,
    variants: product.variants.nodes,
  };
}

function normalizeCart(cart: RawCart): Cart {
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    totalQuantity: cart.totalQuantity,
    lines: cart.lines.nodes.map(({ id, quantity, merchandise }) => ({
      id,
      quantity,
      merchandiseId: merchandise.id,
      variantTitle: merchandise.title,
      selectedOptions: merchandise.selectedOptions,
      price: merchandise.price,
      availableForSale: merchandise.availableForSale,
      productId: merchandise.product.id,
      productHandle: merchandise.product.handle,
      productTitle: merchandise.product.title,
      image: merchandise.product.featuredImage,
    })),
    subtotal: cart.cost.subtotalAmount,
    total: cart.cost.totalAmount,
  };
}

function sendShopifyError(
  req: Request,
  res: Response<{ error: string }>,
  error: unknown,
  status = 502,
) {
  req.log.error({ err: error }, "Shopify storefront request failed");
  const message =
    error instanceof Error ? error.message : "Shopify storefront request failed";
  res.status(status).json({ error: message });
}

function throwOnUserErrors(errors: ShopifyUserError[]) {
  if (errors.length > 0) {
    throw new Error(errors.map(({ message }) => message).join("; "));
  }
}

async function fetchCart(id: string): Promise<Cart | null> {
  const data = await shopifyStorefrontRequest<{ cart: RawCart | null }>(
    `query GetCart($id: ID!) {
      cart(id: $id) {
        ${CART_FIELDS}
      }
    }`,
    { id },
  );
  return data.cart ? normalizeCart(data.cart) : null;
}

router.get("/shopify/collections", async (req, res) => {
  try {
    const data = await shopifyStorefrontRequest<{
      collections: {
        nodes: Array<{
          id: string;
          title: string;
          handle: string;
          description: string;
          image: ShopifyImage | null;
        }>;
      };
    }>(
      `query GetCollections {
        collections(first: 30) {
          nodes { id title handle description image { url altText } }
        }
      }`,
    );
    res.json(data.collections.nodes);
  } catch (error) {
    sendShopifyError(req, res, error);
  }
});

router.get("/shopify/products", async (req, res) => {
  try {
    const first = Math.max(1, Math.min(30, Number(req.query.limit) || 24));
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const collection =
      typeof req.query.collection === "string"
        ? req.query.collection.trim()
        : "";

    if (collection) {
      const data = await shopifyStorefrontRequest<{
        collection: { products: { nodes: RawProduct[] } } | null;
      }>(
        `query GetCollectionProducts($handle: String!, $first: Int!) {
          collection(handle: $handle) {
            products(first: $first) { nodes { ${PRODUCT_FIELDS} } }
          }
        }`,
        { handle: collection, first },
      );
      if (!data.collection) {
        res.status(404).json({ error: "Collection not found." });
        return;
      }
      res.json(data.collection.products.nodes.map(normalizeProduct));
      return;
    }

    const data = await shopifyStorefrontRequest<{
      products: { nodes: RawProduct[] };
    }>(
      `query GetProducts($first: Int!, $query: String) {
        products(first: $first, query: $query, sortKey: UPDATED_AT, reverse: true) {
          nodes { ${PRODUCT_FIELDS} }
        }
      }`,
      { first, query: search || null },
    );
    res.json(data.products.nodes.map(normalizeProduct));
  } catch (error) {
    sendShopifyError(req, res, error);
  }
});

router.get("/shopify/products/:handle", async (req, res) => {
  try {
    const data = await shopifyStorefrontRequest<{
      product: RawProduct | null;
    }>(
      `query GetProduct($handle: String!) {
        product(handle: $handle) { ${PRODUCT_FIELDS} }
      }`,
      { handle: req.params.handle },
    );
    if (!data.product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    res.json(normalizeProduct(data.product));
  } catch (error) {
    sendShopifyError(req, res, error);
  }
});

router.get("/shopify/carts/:cartId", async (req, res) => {
  try {
    const cart = await fetchCart(req.params.cartId);
    if (!cart) {
      res.status(404).json({ error: "Cart not found." });
      return;
    }
    res.json(cart);
  } catch (error) {
    sendShopifyError(req, res, error);
  }
});

router.post("/shopify/carts", async (req, res) => {
  try {
    const lines = req.body?.lines;
    if (!Array.isArray(lines) || lines.length === 0) {
      res.status(400).json({ error: "At least one cart item is required." });
      return;
    }
    const data = await shopifyStorefrontRequest<{
      cartCreate: { cart: RawCart | null; userErrors: ShopifyUserError[] };
    }>(
      `mutation CreateCart($lines: [CartLineInput!]!) {
        cartCreate(input: { lines: $lines }) {
          cart { ${CART_FIELDS} }
          userErrors { message }
        }
      }`,
      { lines },
    );
    throwOnUserErrors(data.cartCreate.userErrors);
    if (!data.cartCreate.cart) {
      throw new Error("Shopify did not return a cart.");
    }
    res.status(201).json(normalizeCart(data.cartCreate.cart));
  } catch (error) {
    sendShopifyError(req, res, error);
  }
});

router.post("/shopify/carts/:cartId/lines", async (req, res) => {
  try {
    const { merchandiseId, quantity } = req.body ?? {};
    if (
      typeof merchandiseId !== "string" ||
      !merchandiseId ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {
      res.status(400).json({ error: "Choose an available product and quantity." });
      return;
    }
    const data = await shopifyStorefrontRequest<{
      cartLinesAdd: { cart: RawCart | null; userErrors: ShopifyUserError[] };
    }>(
      `mutation AddCartLine($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ${CART_FIELDS} }
          userErrors { message }
        }
      }`,
      {
        cartId: req.params.cartId,
        lines: [{ merchandiseId, quantity }],
      },
    );
    throwOnUserErrors(data.cartLinesAdd.userErrors);
    if (!data.cartLinesAdd.cart) {
      throw new Error("Shopify did not return the updated cart.");
    }
    res.json(normalizeCart(data.cartLinesAdd.cart));
  } catch (error) {
    sendShopifyError(req, res, error);
  }
});

router.patch("/shopify/carts/:cartId/lines/:lineId", async (req, res) => {
  try {
    const { quantity } = req.body ?? {};
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      res.status(400).json({ error: "Quantity must be between 1 and 99." });
      return;
    }
    const data = await shopifyStorefrontRequest<{
      cartLinesUpdate: { cart: RawCart | null; userErrors: ShopifyUserError[] };
    }>(
      `mutation UpdateCartLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { ${CART_FIELDS} }
          userErrors { message }
        }
      }`,
      {
        cartId: req.params.cartId,
        lines: [{ id: req.params.lineId, quantity }],
      },
    );
    throwOnUserErrors(data.cartLinesUpdate.userErrors);
    if (!data.cartLinesUpdate.cart) {
      throw new Error("Shopify did not return the updated cart.");
    }
    res.json(normalizeCart(data.cartLinesUpdate.cart));
  } catch (error) {
    sendShopifyError(req, res, error);
  }
});

router.delete("/shopify/carts/:cartId/lines/:lineId", async (req, res) => {
  try {
    const data = await shopifyStorefrontRequest<{
      cartLinesRemove: { cart: RawCart | null; userErrors: ShopifyUserError[] };
    }>(
      `mutation RemoveCartLine($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ${CART_FIELDS} }
          userErrors { message }
        }
      }`,
      { cartId: req.params.cartId, lineIds: [req.params.lineId] },
    );
    throwOnUserErrors(data.cartLinesRemove.userErrors);
    if (!data.cartLinesRemove.cart) {
      throw new Error("Shopify did not return the updated cart.");
    }
    res.json(normalizeCart(data.cartLinesRemove.cart));
  } catch (error) {
    sendShopifyError(req, res, error);
  }
});

export default router;