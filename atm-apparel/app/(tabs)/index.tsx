import { ATMHeader, EmptyState, ErrorState, LoadingState, ProductGrid } from '@/components/store-ui';
import { useColors } from '@/hooks/useColors';
import {
  getListShopifyCollectionsQueryKey,
  getListShopifyProductsQueryKey,
  useListShopifyCollections,
  useListShopifyProducts,
} from '@workspace/api-client-react';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const collections = useListShopifyCollections({
    query: { queryKey: getListShopifyCollectionsQueryKey(), staleTime: 5 * 60_000 },
  });
  const storefrontCollections = (collections.data ?? []).filter(
    (collection) => collection.handle !== 'frontpage',
  );
  const products = useListShopifyProducts(
    { limit: 24 },
    { query: { queryKey: getListShopifyProductsQueryKey({ limit: 24 }), staleTime: 60_000 } },
  );
  const featured = products.data?.find(
    (product) =>
      product.availableForSale &&
      (product.featuredImage?.url || product.images.some((image) => image.url)),
  );
  const heroImage = featured?.featuredImage?.url
    ? featured.featuredImage
    : featured?.images.find((image) => image.url) ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <ATMHeader />
        <View style={{ maxWidth: 900, width: '100%', alignSelf: 'center' }}>
          <View
            style={{
              paddingHorizontal: 22,
              paddingTop: 27,
              paddingBottom: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 9,
            }}
          >
            <View style={{ width: 20, height: 1, backgroundColor: colors.accent }} />
            <Text
              style={{
                color: colors.mutedForeground,
                fontFamily: 'Inter_600SemiBold',
                fontSize: 9,
                letterSpacing: 1.7,
              }}
            >
              ANTHONY THOMAS MELILLO
            </Text>
          </View>

          {products.isLoading ? (
            <View style={{ paddingHorizontal: 22 }}>
              <LoadingState label="Finding your next essential…" />
            </View>
          ) : products.isError ? (
            <ErrorState
              message="The ATM collection isn’t available right now. Your bag will be saved for when the store returns."
              onRetry={() => void products.refetch()}
            />
          ) : featured && heroImage?.url ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Explore ${featured.title}`}
              onPress={() =>
                router.push({
                  pathname: '/product/[handle]',
                  params: { handle: featured.handle },
                })
              }
              style={({ pressed }) => ({
                marginHorizontal: 22,
                height: 400,
                maxHeight: 520,
                overflow: 'hidden',
                backgroundColor: colors.secondary,
                opacity: pressed ? 0.94 : 1,
              })}
            >
              <Image
                source={{ uri: heroImage.url }}
                contentFit="cover"
                transition={250}
                accessibilityLabel={heroImage.altText ?? featured.title}
                style={{ width: '100%', height: '100%' }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  paddingHorizontal: 23,
                  paddingTop: 60,
                  paddingBottom: 24,
                  backgroundColor: colors.heroOverlay,
                }}
              >
                <Text
                  style={{
                    color: colors.onImage,
                    fontFamily: 'Inter_500Medium',
                    fontSize: 9,
                    letterSpacing: 1.8,
                    textTransform: 'uppercase',
                  }}
                >
                  The essential edit
                </Text>
                <Text
                  style={{
                    color: colors.onImage,
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 26,
                    lineHeight: 32,
                    marginTop: 8,
                  }}
                >
                  Everyday, considered.
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 11 }}>
                  <Text
                    style={{
                      color: colors.onImage,
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 10,
                      letterSpacing: 0.8,
                      textTransform: 'uppercase',
                    }}
                  >
                    Discover the collection
                  </Text>
                  <Feather name="arrow-right" size={14} color={colors.onImage} />
                </View>
              </View>
            </Pressable>
          ) : !products.isError && !products.data?.length ? (
            <View style={{ paddingHorizontal: 22 }}>
              <EmptyState
                title="The collection is on its way"
                message="There are no published products in the connected store yet."
              />
            </View>
          ) : null}

          {storefrontCollections.length > 0 ? (
            <View style={{ paddingTop: 28 }}>
              <View
                style={{
                  paddingHorizontal: 22,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: colors.foreground,
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 16,
                  }}
                >
                  Explore ATM
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/shop')}
                  style={{ padding: 4 }}
                >
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontFamily: 'Inter_500Medium',
                      fontSize: 11,
                    }}
                  >
                    View all
                  </Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 22, gap: 9, paddingTop: 15 }}
              >
                {storefrontCollections.slice(0, 12).map((collection) => (
                  <Pressable
                    key={collection.id}
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/shop', params: { collection: collection.handle } })}
                    style={({ pressed }) => ({
                      paddingHorizontal: 15,
                      minHeight: 38,
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: pressed ? colors.secondary : 'transparent',
                    })}
                  >
                    <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium', fontSize: 11 }}>
                      {collection.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {products.data && products.data.length > 0 ? (
            <View style={{ paddingHorizontal: 22, paddingTop: 34 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  marginBottom: 19,
                }}
              >
                <View>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 9,
                      letterSpacing: 1.4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Made to be worn
                  </Text>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 20,
                      marginTop: 6,
                    }}
                  >
                    New & notable
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/shop')}
                  style={{ padding: 4 }}
                >
                  <Feather name="arrow-up-right" size={18} color={colors.foreground} />
                </Pressable>
              </View>
              <ProductGrid products={products.data.slice(0, 6)} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
