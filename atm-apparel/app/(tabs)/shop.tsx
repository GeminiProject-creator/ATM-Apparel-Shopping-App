import { ATMHeader, EmptyState, ErrorState, LoadingState, ProductGrid } from '@/components/store-ui';
import { useColors } from '@/hooks/useColors';
import {
  getListShopifyCollectionsQueryKey,
  getListShopifyProductsQueryKey,
  useListShopifyCollections,
  useListShopifyProducts,
} from '@workspace/api-client-react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export default function ShopScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ collection?: string }>();
  const [selectedCollection, setSelectedCollection] = useState(
    typeof params.collection === 'string' ? params.collection : '',
  );

  useEffect(() => {
    if (typeof params.collection === 'string') {
      setSelectedCollection(params.collection);
    }
  }, [params.collection]);

  const collections = useListShopifyCollections({
    query: { queryKey: getListShopifyCollectionsQueryKey(), staleTime: 5 * 60_000 },
  });
  const storefrontCollections = (collections.data ?? []).filter(
    (collection) => collection.handle !== 'frontpage',
  );
  const products = useListShopifyProducts(
    { collection: selectedCollection || undefined, limit: 30 },
    {
      query: {
        queryKey: getListShopifyProductsQueryKey({
          collection: selectedCollection || undefined,
          limit: 30,
        }),
        staleTime: 60_000,
      },
    },
  );
  const selectedTitle =
    storefrontCollections.find((collection) => collection.handle === selectedCollection)?.title ??
    'Shop all';

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
              paddingTop: 29,
              paddingBottom: 22,
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 9,
                  letterSpacing: 1.6,
                  textTransform: 'uppercase',
                }}
              >
                The collection
              </Text>
              <Text
                style={{
                  color: colors.foreground,
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 27,
                  marginTop: 7,
                }}
              >
                {selectedTitle}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search products"
              onPress={() => router.push('/search')}
              style={{ padding: 6 }}
            >
              <Feather name="search" size={19} color={colors.foreground} />
            </Pressable>
          </View>

          {collections.isLoading ? (
            <LoadingState label="Loading collections…" />
          ) : collections.isError ? (
            <ErrorState
              message="Collections couldn’t be loaded. Try again in a moment."
              onRetry={() => void collections.refetch()}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 22,
                gap: 8,
                paddingBottom: 18,
              }}
            >
              <CollectionChip
                title="Shop all"
                active={!selectedCollection}
                onPress={() => setSelectedCollection('')}
              />
              {storefrontCollections.map((collection) => (
                <CollectionChip
                  key={collection.id}
                  title={collection.title}
                  active={selectedCollection === collection.handle}
                  onPress={() => setSelectedCollection(collection.handle)}
                />
              ))}
            </ScrollView>
          )}

          <View
            style={{
              marginHorizontal: 22,
              marginBottom: 21,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 11 }}>
              {products.data ? `${products.data.length} pieces` : ' '}
            </Text>
          </View>

          {products.isLoading ? (
            <LoadingState label="Loading products…" />
          ) : products.isError ? (
            <ErrorState
              message="The products in this collection aren’t available right now."
              onRetry={() => void products.refetch()}
            />
          ) : products.data?.length ? (
            <View style={{ paddingHorizontal: 22 }}>
              <ProductGrid products={products.data} />
            </View>
          ) : (
            <EmptyState
              title="Nothing here just yet"
              message="Try another collection or browse everything in the store."
              action={
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSelectedCollection('')}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                    backgroundColor: colors.primary,
                  }}
                >
                  <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>
                    Shop all
                  </Text>
                </Pressable>
              }
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function CollectionChip({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        minHeight: 36,
        justifyContent: 'center',
        paddingHorizontal: 14,
        backgroundColor: active ? colors.primary : 'transparent',
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text
        style={{
          color: active ? colors.primaryForeground : colors.foreground,
          fontFamily: 'Inter_500Medium',
          fontSize: 10,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}