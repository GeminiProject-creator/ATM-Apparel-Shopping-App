import { EmptyState, ErrorState, LoadingState, ProductGrid } from '@/components/store-ui';
import { useColors } from '@/hooks/useColors';
import {
  getListShopifyProductsQueryKey,
  useListShopifyProducts,
} from '@workspace/api-client-react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const topInset = Platform.OS === 'web' ? Math.max(67, insets.top) : insets.top;
  const products = useListShopifyProducts(
    { search: search || undefined, limit: 30 },
    {
      query: {
        queryKey: getListShopifyProductsQueryKey({
          search: search || undefined,
          limit: 30,
        }),
        enabled: search.trim().length >= 2,
        staleTime: 30_000,
      },
    },
  );

  useEffect(() => {
    const timer = setTimeout(() => setSearch(text.trim()), 280);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: topInset,
          paddingHorizontal: 18,
          minHeight: topInset + 63,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={{ padding: 6 }}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View
          style={{
            flex: 1,
            height: 42,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            gap: 9,
            backgroundColor: colors.secondary,
          }}
        >
          <Feather name="search" size={17} color={colors.mutedForeground} />
          <TextInput
            accessibilityLabel="Search ATM products"
            testID="product-search"
            autoFocus
            value={text}
            onChangeText={setText}
            placeholder="Search the collection"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="search"
            onSubmitEditing={() => setSearch(text.trim())}
            style={{
              flex: 1,
              padding: 0,
              color: colors.foreground,
              fontFamily: 'Inter_400Regular',
              fontSize: 13,
              outlineStyle: 'none',
            } as never}
          />
          {text.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => {
                setText('');
                setSearch('');
              }}
              style={{ padding: 3 }}
            >
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingTop: 23,
          paddingBottom: Platform.OS === 'web' ? 68 : 32,
        }}
      >
        {search.trim().length < 2 ? (
          <View style={{ paddingTop: 27 }}>
            <Text
              style={{
                color: colors.mutedForeground,
                fontFamily: 'Inter_600SemiBold',
                fontSize: 9,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
              }}
            >
              Search ATM
            </Text>
            <Text
              style={{
                color: colors.foreground,
                fontFamily: 'Inter_400Regular',
                fontSize: 15,
                lineHeight: 23,
                marginTop: 11,
              }}
            >
              Find a favorite by name, style, or fabric.
            </Text>
          </View>
        ) : products.isLoading ? (
          <LoadingState label="Searching the collection…" />
        ) : products.isError ? (
          <ErrorState
            message="Search is temporarily unavailable. Try again."
            onRetry={() => void products.refetch()}
          />
        ) : products.data?.length ? (
          <>
            <Text
              style={{
                color: colors.mutedForeground,
                fontFamily: 'Inter_400Regular',
                fontSize: 11,
                marginBottom: 18,
              }}
            >
              {products.data.length} results for “{search}”
            </Text>
            <ProductGrid products={products.data} />
          </>
        ) : (
          <EmptyState
            title="No matches found"
            message="Try a different product name or search term."
          />
        )}
      </ScrollView>
    </View>
  );
}