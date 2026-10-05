import {
  ErrorState,
  LoadingState,
  PrimaryButton,
  formatMoney,
} from '@/components/store-ui';
import { useCart } from '@/context/cart-context';
import { useColors } from '@/hooks/useColors';
import {
  getGetShopifyProductQueryKey,
  useGetShopifyProduct,
} from '@workspace/api-client-react';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProductScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const product = useGetShopifyProduct(typeof handle === 'string' ? handle : '', {
    query: {
      queryKey: getGetShopifyProductQueryKey(typeof handle === 'string' ? handle : ''),
      enabled: typeof handle === 'string' && Boolean(handle),
    },
  });
  const cart = useCart();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const safeTop = Platform.OS === 'web' ? Math.max(67, insets.top) : insets.top;
  const safeBottom = Platform.OS === 'web' ? 34 : insets.bottom;

  const optionGroups = useMemo(() => {
    const variants = product.data?.variants ?? [];
    const names = variants[0]?.selectedOptions.map((option) => option.name) ?? [];
    return names.map((name) => ({
      name,
      values: Array.from(
        new Set(
          variants
            .map((variant) => variant.selectedOptions.find((option) => option.name === name)?.value)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    }));
  }, [product.data?.variants]);

  const defaults = useMemo(() => {
    const initial = product.data?.variants.find((variant) => variant.availableForSale);
    return Object.fromEntries(
      initial?.selectedOptions.map((option) => [option.name, option.value]) ?? [],
    );
  }, [product.data?.variants]);
  const activeOptions = { ...defaults, ...selectedOptions };
  const selectedVariant = product.data?.variants.find((variant) =>
    variant.selectedOptions.every((option) => activeOptions[option.name] === option.value),
  );
  const images = product.data?.images.length
    ? product.data.images
    : product.data?.featuredImage
      ? [product.data.featuredImage]
      : [];
  const canAdd = Boolean(selectedVariant?.availableForSale && product.data?.availableForSale);

  const handleAdd = async () => {
    if (!selectedVariant || !canAdd) return;
    setAdded(false);
    const success = await cart.addItem(selectedVariant.id);
    if (success) {
      setAdded(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          height: safeTop + 54,
          paddingTop: safeTop,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.background,
          zIndex: 2,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={{ padding: 8 }}
        >
          <Feather name="arrow-left" size={21} color={colors.foreground} />
        </Pressable>
        <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: 3 }}>
          ATM
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Shopping bag, ${cart.count} items`}
          onPress={() => router.push('/bag')}
          style={{ padding: 8 }}
        >
          <Feather name="shopping-bag" size={18} color={colors.foreground} />
        </Pressable>
      </View>

      {product.isLoading ? (
        <LoadingState label="Loading product details…" />
      ) : product.isError ? (
        <ErrorState
          message="This product couldn’t be loaded. Check your connection and try again."
          onRetry={() => void product.refetch()}
        />
      ) : product.data ? (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: safeBottom + 132,
              width: Math.min(width, 850),
              alignSelf: 'center',
            }}
          >
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const page = Math.round(event.nativeEvent.contentOffset.x / width);
                setActiveImage(page);
              }}
              style={{ width, maxWidth: 850, alignSelf: 'center' }}
            >
              {images.map((image, index) => (
                <Image
                  key={`${image.url}-${index}`}
                  source={{ uri: image.url }}
                  contentFit="cover"
                  transition={180}
                  accessibilityLabel={image.altText ?? product.data.title}
                  style={{
                    width: Math.min(width, 850),
                    height: Math.min(width * 1.08, 760),
                    backgroundColor: colors.secondary,
                  }}
                />
              ))}
            </ScrollView>
            {images.length > 1 ? (
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7, paddingTop: 13 }}>
                {images.map((image, index) => (
                  <View
                    key={`${image.url}-dot-${index}`}
                    style={{
                      width: activeImage === index ? 16 : 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: activeImage === index ? colors.foreground : colors.border,
                    }}
                  />
                ))}
              </View>
            ) : null}

            <View style={{ paddingHorizontal: 22, paddingTop: 23, maxWidth: 700, alignSelf: 'center', width: '100%' }}>
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 9,
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                }}
              >
                {product.data.productType || 'ATM collection'}
              </Text>
              <Text
                style={{
                  color: colors.foreground,
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 23,
                  lineHeight: 29,
                  marginTop: 8,
                }}
              >
                {product.data.title}
              </Text>
              {selectedVariant ? (
                <Text
                  style={{
                    color: colors.foreground,
                    fontFamily: 'Inter_500Medium',
                    fontSize: 14,
                    marginTop: 10,
                  }}
                >
                  {formatMoney(selectedVariant.price)}
                </Text>
              ) : null}

              {optionGroups.map((group) => (
                <View key={group.name} style={{ marginTop: 23 }}>
                  <View style={{ flexDirection: 'row', gap: 7 }}>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: 'Inter_600SemiBold',
                        fontSize: 10,
                        letterSpacing: 0.6,
                        textTransform: 'uppercase',
                      }}
                    >
                      {group.name}
                    </Text>
                    {activeOptions[group.name] ? (
                      <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10 }}>
                        {activeOptions[group.name]}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {group.values.map((value) => {
                      const selected = activeOptions[group.name] === value;
                      const otherOptions = { ...activeOptions, [group.name]: value };
                      const available = product.data.variants.some(
                        (variant) =>
                          variant.availableForSale &&
                          variant.selectedOptions.every(
                            (option) => otherOptions[option.name] === option.value,
                          ),
                      );
                      return (
                        <Pressable
                          key={`${group.name}-${value}`}
                          accessibilityRole="button"
                          accessibilityState={{ selected, disabled: !available }}
                          accessibilityLabel={`${group.name} ${value}${available ? '' : ', unavailable'}`}
                          disabled={!available}
                          onPress={() => {
                            setSelectedOptions((current) => ({ ...current, [group.name]: value }));
                            setAdded(false);
                            void Haptics.selectionAsync();
                          }}
                          style={{
                            minWidth: group.name.toLowerCase() === 'size' ? 47 : 56,
                            minHeight: 40,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 11,
                            borderWidth: 1,
                            borderColor: selected ? colors.foreground : colors.border,
                            backgroundColor: selected ? colors.foreground : 'transparent',
                            opacity: available ? 1 : 0.35,
                          }}
                        >
                          <Text
                            style={{
                              color: selected ? colors.background : colors.foreground,
                              fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                              fontSize: 11,
                            }}
                          >
                            {value}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}

              {product.data.description ? (
                <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 25, paddingTop: 20 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: 'Inter_400Regular',
                      fontSize: 13,
                      lineHeight: 21,
                    }}
                  >
                    {product.data.description}
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: 22,
              paddingTop: 12,
              paddingBottom: safeBottom + 10,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <View style={{ width: '100%', maxWidth: 700, alignSelf: 'center' }}>
              {cart.error ? (
                <Text
                  accessibilityRole="alert"
                  style={{
                    color: colors.destructive,
                    fontFamily: 'Inter_400Regular',
                    fontSize: 11,
                    marginBottom: 8,
                  }}
                >
                  {cart.error}
                </Text>
              ) : null}
              {added ? (
                <Pressable
                  accessibilityRole="button"
                  testID="view-bag-after-add"
                  onPress={() => router.push('/bag')}
                  style={{
                    alignItems: 'center',
                    paddingVertical: 8,
                    marginBottom: 5,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>
                    Added to your bag · View bag
                  </Text>
                </Pressable>
              ) : null}
              <PrimaryButton
                label={!product.data.availableForSale ? 'Sold out' : !canAdd ? 'Choose an available option' : cart.isBusy ? 'Adding to bag…' : 'Add to bag'}
                onPress={() => void handleAdd()}
                disabled={!canAdd || cart.isBusy}
                testID="add-to-bag"
                icon={canAdd ? 'shopping-bag' : undefined}
              />
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}