import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getGetShopifyCartQueryKey,
  useAddShopifyCartLine,
  useCreateShopifyCart,
  useGetShopifyCart,
  useRemoveShopifyCartLine,
  useUpdateShopifyCartLine,
  type ShopifyCart,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const CART_STORAGE_KEY = 'atm-shopify-cart-id';

interface CartContextValue {
  cart: ShopifyCart | null;
  count: number;
  isLoading: boolean;
  isBusy: boolean;
  error: string | null;
  addItem: (merchandiseId: string, quantity?: number) => Promise<boolean>;
  setQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function CartProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [cartId, setCartId] = useState<string | null>(null);
  const [cartSnapshot, setCartSnapshot] = useState<ShopifyCart | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(CART_STORAGE_KEY)
      .then((storedId) => {
        if (active) setCartId(storedId);
      })
      .catch(() => {
        if (active) setActionError('Your saved bag could not be restored.');
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const cartQuery = useGetShopifyCart(cartId ?? '', {
    query: {
      enabled: hydrated && Boolean(cartId),
      retry: false,
      staleTime: 60_000,
      queryKey: getGetShopifyCartQueryKey(cartId ?? ''),
    },
  });

  const applyCart = useCallback(
    (nextCart: ShopifyCart) => {
      setCartSnapshot(nextCart);
      setCartId(nextCart.id);
      queryClient.setQueryData(getGetShopifyCartQueryKey(nextCart.id), nextCart);
      void AsyncStorage.setItem(CART_STORAGE_KEY, nextCart.id).catch(() => {
        setActionError('Your bag is active, but could not be saved on this device.');
      });
    },
    [queryClient],
  );

  const createCart = useCreateShopifyCart({
    mutation: { onSuccess: applyCart },
  });
  const addLine = useAddShopifyCartLine({
    mutation: { onSuccess: applyCart },
  });
  const updateLine = useUpdateShopifyCartLine({
    mutation: { onSuccess: applyCart },
  });
  const removeLine = useRemoveShopifyCartLine({
    mutation: { onSuccess: applyCart },
  });

  useEffect(() => {
    if (cartQuery.data) {
      setCartSnapshot(cartQuery.data);
    }
  }, [cartQuery.data]);

  useEffect(() => {
    const status = (cartQuery.error as { status?: number } | null)?.status;
    if (status === 404) {
      setCartId(null);
      setCartSnapshot(null);
      void AsyncStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [cartQuery.error]);

  const addItem = useCallback(
    async (merchandiseId: string, quantity = 1) => {
      setActionError(null);
      try {
        if (cartId) {
          await addLine.mutateAsync({
            cartId,
            data: { merchandiseId, quantity },
          });
        } else {
          await createCart.mutateAsync({
            data: {
              lines: [{ merchandiseId, quantity }],
            },
          });
        }
        return true;
      } catch (error) {
        setActionError(messageFor(error));
        return false;
      }
    },
    [addLine, cartId, createCart],
  );

  const setQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cartId) return;
      setActionError(null);
      try {
        if (quantity < 1) {
          await removeLine.mutateAsync({ cartId, lineId });
        } else {
          await updateLine.mutateAsync({
            cartId,
            lineId,
            data: { quantity },
          });
        }
      } catch (error) {
        setActionError(messageFor(error));
      }
    },
    [cartId, removeLine, updateLine],
  );

  const removeItem = useCallback(
    async (lineId: string) => {
      if (!cartId) return;
      setActionError(null);
      try {
        await removeLine.mutateAsync({ cartId, lineId });
      } catch (error) {
        setActionError(messageFor(error));
      }
    },
    [cartId, removeLine],
  );

  const refresh = useCallback(async () => {
    if (cartId) await cartQuery.refetch();
  }, [cartId, cartQuery]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart: cartQuery.data ?? cartSnapshot,
      count: cartQuery.data?.totalQuantity ?? cartSnapshot?.totalQuantity ?? 0,
      isLoading: !hydrated || Boolean(cartId && cartQuery.isPending),
      isBusy:
        createCart.isPending ||
        addLine.isPending ||
        updateLine.isPending ||
        removeLine.isPending,
      error: actionError ?? (cartQuery.isError ? messageFor(cartQuery.error) : null),
      addItem,
      setQuantity,
      removeItem,
      refresh,
      clearError: () => setActionError(null),
    }),
    [
      actionError,
      addItem,
      addLine.isPending,
      cartId,
      cartQuery.data,
      cartQuery.error,
      cartQuery.isError,
      cartQuery.isPending,
      cartSnapshot,
      createCart.isPending,
      hydrated,
      refresh,
      removeItem,
      removeLine.isPending,
      setQuantity,
      updateLine.isPending,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider.');
  }
  return context;
}