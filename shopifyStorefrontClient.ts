const STOREFRONT_API_VERSION = "2026-04";
const CONFIG_CACHE_TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 10_000;

type ShopifyStorefrontConfig = {
  shopDomain: string;
  storefrontAccessToken: string;
};

let cachedConfig:
  | { value: ShopifyStorefrontConfig; expiresAt: number }
  | undefined;

function readConfigFromEnvironment(): ShopifyStorefrontConfig {
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const storefrontAccessToken =
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();

  if (!shopDomain || !storefrontAccessToken) {
    throw new Error(
      "Missing Shopify Storefront configuration. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN.",
    );
  }

  return {
    shopDomain: shopDomain
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, ""),
    storefrontAccessToken,
  };
}

export async function getShopifyStorefrontConfig(): Promise<ShopifyStorefrontConfig> {
  if (cachedConfig && Date.now() < cachedConfig.expiresAt) {
    return cachedConfig.value;
  }

  const value = readConfigFromEnvironment();
  cachedConfig = {
    value,
    expiresAt: Date.now() + CONFIG_CACHE_TTL_MS,
  };
  return value;
}

export async function shopifyStorefrontRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const config = await getShopifyStorefrontConfig();

  const resp = await fetch(
    `https://${config.shopDomain}/api/${STOREFRONT_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token":
          config.storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    },
  );

  const text = await resp.text();
  const json = text ? safeJsonParse(text) : {};

  if (!resp.ok || json.errors?.length) {
    throw new Error(
      `Shopify Storefront API error (${resp.status}): ${JSON.stringify(
        json.errors ?? json,
      )}`,
    );
  }

  return json.data as T;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { errors: [{ message: text }] };
  }
}
