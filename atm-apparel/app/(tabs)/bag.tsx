import {
  ATMHeader,
  EmptyState,
  ErrorState,
  LoadingState,
  PrimaryButton,
  formatMoney,
} from '@/components/store-ui';
import { useCart } from '@/context/cart-context';
import { useColors } from '@/hooks/useColors';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

export default function BagScreen() {
  const colors = useColors();
  const router = useRouter();
  const cart = useCart();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const openCheckout = async () => {
    const url = cart.cart?.checkoutUrl;
    if (!url) {
      setCheckoutError('Shopify checkout is unavailable. Refresh your bag and try again.');
      return;
    }
    try {
      await Linking.openURL(url);
      setCheckoutError(null);
      void Haptics.selectionAsync();
    } catch {
      setCheckoutError('Could not open secure checkout. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ATMHeader showSearch={false} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={{ maxWidth: 900, width: '100%', alignSelf: 'center' }}>
          <View style={{ paddingHorizontal: 22, paddingTop: 30, paddingBottom: 20 }}>
            <Text
              style={{
                color: colors.mutedForeground,
                fontFamily: 'Inter_600SemiBold',
                fontSize: 9,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Your selections
            </Text>
            <Text
              style={{
                color: colors.foreground,
                fontFamily: 'Inter_600SemiBold',
                fontSize: 27,
                marginTop: 6,
              }}
            >
              The bag{cart.count > 0 ? ` · ${cart.count}` : ''}
            </Text>
          </View>

          {cart.isLoading ? (
            <LoadingState label="Restoring your bag…" />
          ) : cart.error && !cart.cart ? (
            <ErrorState message={cart.error} onRetry={() => void cart.refresh()} />
          ) : !cart.cart?.lines.length ? (
            <EmptyState
              title="Your bag is waiting"
              message="Find the pieces you’ll reach for every day."
              action={
                <PrimaryButton
                  label="Explore the collection"
                  onPress={() => router.push('/shop')}
                  testID="empty-bag-shop"
                />
              }
            />
          ) : (
            <View style={{ paddingHorizontal: 22 }}>
              {cart.cart.lines.map((line) => (
                <View
                  key={line.id}
                  style={{
                    flexDirection: 'row',
                    paddingVertical: 17,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    gap: 15,
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View ${line.productTitle}`}
                    onPress={() =>
                      router.push({
                        pathname: '/product/[handle]',
                        params: { handle: line.productHandle },
                      })
                    }
                    style={{
                      width: 91,
                      aspectRatio: 0.76,
                      backgroundColor: colors.secondary,
                    }}
                  >
                    {line.image?.url ? (
                      <Image
                        source={{ uri: line.image.url }}
                        contentFit="cover"
                        style={{ width: '100%', height: '100%' }}
                        accessibilityLabel={line.image.altText ?? line.productTitle}
                      />
                    ) : null}
                  </Pressable>
                  <View style={{ flex: 1, paddingVertical: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                      <Text
                        style={{
                          flex: 1,
                          color: colors.foreground,
                          fontFamily: 'Inter_500Medium',
                          fontSize: 13,
                          lineHeight: 18,
                        }}
                      >
                        {line.productTitle}
                      </Text>
                      <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>
                        {formatMoney(line.price)}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontFamily: 'Inter_400Regular',
                        fontSize: 11,
                        marginTop: 7,
                      }}
                    >
                      {line.selectedOptions.length
                        ? line.selectedOptions.map((option) => option.value).join(' / ')
                        : line.variantTitle === 'Default Title'
                          ? 'One size'
                          : line.variantTitle}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 14,
                      }}
                    >
                      <View
                        style={{
                          height: 34,
                          flexDirection: 'row',
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <QuantityButton
                          label="Decrease quantity"
                          icon="minus"
                          disabled={cart.isBusy}
                          onPress={() => void cart.setQuantity(line.id, line.quantity - 1)}
                        />
                        <Text
                          accessibilityLabel={`Quantity ${line.quantity}`}
                          style={{
                            minWidth: 28,
                            color: colors.foreground,
                            textAlign: 'center',
                            fontFamily: 'Inter_500Medium',
                            fontSize: 12,
                          }}
                        >
                          {line.quantity}
                        </Text>
                        <QuantityButton
                          label="Increase quantity"
                          icon="plus"
                          disabled={cart.isBusy || line.quantity >= 99}
                          onPress={() => void cart.setQuantity(line.id, line.quantity + 1)}
                        />
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${line.productTitle}`}
                        disabled={cart.isBusy}
                        onPress={() => void cart.removeItem(line.id)}
                        style={{ padding: 6 }}
                      >
                        <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}

              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: 18,
                  marginTop: 6,
                }}
              >
                {cart.error ? (
                  <Text
                    accessibilityRole="alert"
                    style={{
                      color: colors.destructive,
                      fontFamily: 'Inter_400Regular',
                      fontSize: 12,
                      lineHeight: 18,
                      marginBottom: 14,
                    }}
                  >
                    {cart.error}
                  </Text>
                ) : null}
                <SummaryRow label="Subtotal" value={formatMoney(cart.cart.subtotal)} />
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontFamily: 'Inter_400Regular',
                    fontSize: 11,
                    lineHeight: 17,
                    marginTop: 10,
                  }}
                >
                  Shipping, discounts and taxes are calculated at Shopify checkout.
                </Text>
                {checkoutError ? (
                  <Text
                    accessibilityRole="alert"
                    style={{
                      color: colors.destructive,
                      fontFamily: 'Inter_400Regular',
                      fontSize: 12,
                      marginTop: 12,
                    }}
                  >
                    {checkoutError}
                  </Text>
                ) : null}
                <View style={{ marginTop: 21 }}>
                  <PrimaryButton
                    label={cart.isBusy ? 'Updating bag…' : 'Secure checkout'}
                    icon="lock"
                    onPress={() => void openCheckout()}
                    disabled={cart.isBusy}
                    testID="secure-checkout"
                  />
                </View>
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontFamily: 'Inter_400Regular',
                    fontSize: 10,
                    textAlign: 'center',
                    marginTop: 11,
                  }}
                >
                  Secure checkout powered by Shopify
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function QuantityButton({
  label,
  icon,
  disabled,
  onPress,
}: {
  label: string;
  icon: 'minus' | 'plus';
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={{ width: 34, height: 32, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.45 : 1 }}
    >
      <Feather name={icon} size={13} color={colors.foreground} />
    </Pressable>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium', fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>{value}</Text>
    </View>
  );
}