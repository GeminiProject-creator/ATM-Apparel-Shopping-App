import { useColors } from '@/hooks/useColors';
import { useCart } from '@/context/cart-context';
import type { ShopifyMoney, ShopifyProduct } from '@workspace/api-client-react';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

export function formatMoney(money: ShopifyMoney) {
  const value = Number(money.amount);
  if (!Number.isFinite(value)) return `${money.amount} ${money.currencyCode}`;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: money.currencyCode,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${money.currencyCode} ${value.toFixed(2)}`;
  }
}

export function lowestPrice(product: ShopifyProduct) {
  const available = product.variants.filter((variant) => variant.availableForSale);
  const variants = available.length ? available : product.variants;
  return [...variants].sort(
    (a, b) => Number(a.price.amount) - Number(b.price.amount),
  )[0]?.price;
}

export function ATMHeader({
  showSearch = true,
  showBag = true,
}: {
  showSearch?: boolean;
  showBag?: boolean;
}) {
  const colors = useColors();
  const router = useRouter();
  const { count } = useCart();

  return (
    <View
      style={{
        minHeight: 62,
        paddingHorizontal: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="ATM Apparel home"
        onPress={() => router.push('/')}
        style={{ paddingVertical: 8 }}
      >
        <Text
          style={{
            color: colors.foreground,
            fontFamily: 'Inter_700Bold',
            fontSize: 23,
            letterSpacing: 3.5,
          }}
        >
          ATM
        </Text>
        <Text
          style={{
            color: colors.mutedForeground,
            fontFamily: 'Inter_500Medium',
            fontSize: 7,
            letterSpacing: 1.3,
            marginTop: 1,
          }}
        >
          ANTHONY THOMAS MELILLO
        </Text>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {showSearch ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search products"
            testID="search-button"
            hitSlop={10}
            onPress={() => router.push('/search')}
            style={{ padding: 4 }}
          >
            <Feather name="search" size={20} color={colors.foreground} />
          </Pressable>
        ) : null}
        {showBag ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Shopping bag, ${count} items`}
            testID="bag-button"
            hitSlop={10}
            onPress={() => router.push('/bag')}
            style={{ padding: 4 }}
          >
            <Feather name="shopping-bag" size={19} color={colors.foreground} />
            {count > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  right: -7,
                  top: -7,
                  minWidth: 16,
                  height: 16,
                  paddingHorizontal: 4,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary,
                }}
              >
                <Text
                  style={{
                    color: colors.primaryForeground,
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 9,
                  }}
                >
                  {count > 99 ? '99+' : count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const colors = useColors();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(132, (Math.min(width, 900) - 56) / 2);
  const price = lowestPrice(product);
  const image =
    product.featuredImage?.url
      ? product.featuredImage
      : product.images.find((candidate) => candidate.url) ?? null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${product.title}`}
      testID={`product-${product.handle}`}
      onPress={() =>
        router.push({
          pathname: '/product/[handle]',
          params: { handle: product.handle },
        })
      }
      style={({ pressed }) => ({
        width: cardWidth,
        opacity: pressed ? 0.88 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View
        style={{
          width: '100%',
          aspectRatio: 0.79,
          overflow: 'hidden',
          backgroundColor: colors.secondary,
        }}
      >
        {image?.url ? (
          <Image
            source={{ uri: image.url }}
            contentFit="cover"
            transition={180}
            accessibilityLabel={image.altText ?? product.title}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: colors.mutedForeground,
                fontFamily: 'Inter_700Bold',
                fontSize: 24,
                letterSpacing: 4,
              }}
            >
              ATM
            </Text>
          </View>
        )}
        {!product.availableForSale ? (
          <View
            style={{
              position: 'absolute',
              left: 10,
              top: 10,
              paddingHorizontal: 9,
              paddingVertical: 5,
              backgroundColor: colors.background,
            }}
          >
            <Text
              style={{
                color: colors.foreground,
                fontFamily: 'Inter_500Medium',
                fontSize: 9,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              Sold out
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        numberOfLines={2}
        style={{
          color: colors.foreground,
          fontFamily: 'Inter_500Medium',
          fontSize: 12,
          lineHeight: 17,
          marginTop: 11,
        }}
      >
        {product.title}
      </Text>
      <Text
        style={{
          color: colors.mutedForeground,
          fontFamily: 'Inter_400Regular',
          fontSize: 12,
          marginTop: 4,
        }}
      >
        {price ? formatMoney(price) : 'View details'}
      </Text>
    </Pressable>
  );
}

export function ProductGrid({ products }: { products: ShopifyProduct[] }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 25,
      }}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </View>
  );
}

export function LoadingState({ label = 'Loading the collection…' }: { label?: string }) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="progressbar"
      style={{ paddingVertical: 56, alignItems: 'center', gap: 12 }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: colors.border,
          borderTopColor: colors.foreground,
        }}
      />
      <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13 }}>
        {label}
      </Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        paddingHorizontal: 22,
        paddingVertical: 48,
        alignItems: 'center',
        gap: 13,
      }}
    >
      <Feather name="wifi-off" size={22} color={colors.mutedForeground} />
      <Text
        style={{
          color: colors.foreground,
          fontFamily: 'Inter_600SemiBold',
          fontSize: 16,
          textAlign: 'center',
        }}
      >
        We couldn’t load the store
      </Text>
      <Text
        style={{
          maxWidth: 300,
          color: colors.mutedForeground,
          fontFamily: 'Inter_400Regular',
          fontSize: 13,
          lineHeight: 19,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={{
          marginTop: 3,
          minHeight: 42,
          justifyContent: 'center',
          paddingHorizontal: 20,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            color: colors.foreground,
            fontFamily: 'Inter_600SemiBold',
            fontSize: 12,
            letterSpacing: 0.4,
          }}
        >
          Try again
        </Text>
      </Pressable>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={{ paddingHorizontal: 28, paddingVertical: 58, alignItems: 'center' }}>
      <Feather name="shopping-bag" size={24} color={colors.mutedForeground} />
      <Text
        style={{
          color: colors.foreground,
          fontFamily: 'Inter_600SemiBold',
          fontSize: 17,
          marginTop: 17,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: colors.mutedForeground,
          fontFamily: 'Inter_400Regular',
          fontSize: 13,
          lineHeight: 20,
          marginTop: 7,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
      {action ? <View style={{ marginTop: 20 }}>{action}</View> : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  testID,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  icon?: keyof typeof Feather.glyphMap;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 54,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: disabled ? colors.muted : colors.primary,
        opacity: pressed && !disabled ? 0.86 : 1,
      })}
    >
      {icon ? <Feather name={icon} size={16} color={disabled ? colors.mutedForeground : colors.primaryForeground} /> : null}
      <Text
        style={{
          color: disabled ? colors.mutedForeground : colors.primaryForeground,
          fontFamily: 'Inter_600SemiBold',
          fontSize: 12,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}