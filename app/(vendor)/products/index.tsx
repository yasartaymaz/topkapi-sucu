import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Link, Stack, useRouter } from 'expo-router';
import { ChevronLeft, Package, Plus } from 'lucide-react-native';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { formatTL } from '@/lib/format';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

type Product = {
  id: string;
  name: string;
  brand: string | null;
  volume_liters: number | null;
  price: number;
  image_path: string | null;
  stock_status: string;
};

export default function VendorProducts() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data: vendor } = useQuery({
    queryKey: qk.myVendor(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id')
        .eq('profile_id', userId!)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
  const vendorId = vendor?.id ?? null;

  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: qk.myProducts(vendorId),
    enabled: !!vendorId,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, volume_liters, price, image_path, stock_status')
        .eq('vendor_id', vendorId!)
        .is('deleted_at', null)
        .order('name');
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const toggleStock = async (p: Product) => {
    const next = p.stock_status === 'in_stock' ? 'out_of_stock' : 'in_stock';
    const { error } = await supabase
      .from('products')
      .update({ stock_status: next })
      .eq('id', p.id);
    if (error) {
      Alert.alert('Hata', error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: qk.myProducts(vendorId) });
  };

  const remove = (p: Product) => {
    Alert.alert('Ürün silinsin mi?', `"${p.name}" silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('products')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', p.id);
          if (error) {
            Alert.alert('Hata', error.message);
            return;
          }
          queryClient.invalidateQueries({ queryKey: qk.myProducts(vendorId) });
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center border-b border-slate-100 bg-white px-3 py-3">
        <Pressable onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <Text className="ml-1 flex-1 text-lg font-bold text-slate-900">
          Ürünlerim
        </Text>
        <Link href="/(vendor)/products/edit" asChild>
          <Pressable className="h-9 flex-row items-center rounded-full bg-brand-500 px-3 active:bg-brand-600">
            <Plus size={16} color="#fff" />
            <Text className="ml-1 text-sm font-semibold text-white">Yeni</Text>
          </Pressable>
        </Link>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 20, gap: 10 }}
          onRefresh={refetch}
          refreshing={false}
          ListEmptyComponent={
            <View className="items-center rounded-2xl bg-white p-8">
              <Package size={28} color="#94A3B8" />
              <Text className="mt-2 text-base font-semibold text-slate-900">
                Ürün yok
              </Text>
              <Text className="mt-1 text-center text-sm text-slate-500">
                Sattığın su ürünlerini ekle, müşteriler sipariş verebilsin.
              </Text>
              <Link href="/(vendor)/products/edit" asChild>
                <Pressable className="mt-4 h-11 flex-row items-center rounded-xl bg-brand-500 px-4 active:bg-brand-600">
                  <Plus size={16} color="#fff" />
                  <Text className="ml-1 text-sm font-semibold text-white">
                    Ürün ekle
                  </Text>
                </Pressable>
              </Link>
            </View>
          }
          renderItem={({ item }) => (
            <View className="rounded-2xl bg-white p-3">
              <View className="flex-row items-center">
                {item.image_path ? (
                  <Image
                    source={{
                      uri: supabase.storage.from('product-images').getPublicUrl(item.image_path).data.publicUrl,
                    }}
                    style={{ width: 56, height: 56, borderRadius: 12 }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="h-14 w-14 items-center justify-center rounded-xl bg-brand-100">
                    <Package size={22} color="#0369A1" />
                  </View>
                )}
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {item.brand ? `${item.brand} • ` : ''}
                    {item.volume_liters ? `${item.volume_liters} L` : ''}
                  </Text>
                  <Text className="mt-0.5 text-base font-bold text-brand-700">
                    {formatTL(item.price)}
                  </Text>
                </View>
                {item.stock_status === 'out_of_stock' && (
                  <View className="rounded-full bg-amber-100 px-2 py-0.5">
                    <Text className="text-[10px] font-semibold text-amber-800">
                      Stokta yok
                    </Text>
                  </View>
                )}
              </View>
              <View className="mt-3 flex-row gap-2">
                <Pressable
                  onPress={() => toggleStock(item)}
                  className="h-9 flex-row items-center rounded-lg bg-slate-100 px-3 active:bg-slate-200"
                >
                  <Text className="text-xs font-semibold text-slate-700">
                    {item.stock_status === 'in_stock' ? 'Stoktan kaldır' : 'Stoğa ekle'}
                  </Text>
                </Pressable>
                <Link
                  href={{ pathname: '/(vendor)/products/edit', params: { id: item.id } }}
                  asChild
                >
                  <Pressable className="h-9 flex-row items-center rounded-lg bg-slate-100 px-3 active:bg-slate-200">
                    <Text className="text-xs font-semibold text-slate-700">
                      Düzenle
                    </Text>
                  </Pressable>
                </Link>
                <Pressable
                  onPress={() => remove(item)}
                  className="h-9 flex-row items-center rounded-lg bg-red-50 px-3 active:bg-red-100"
                >
                  <Text className="text-xs font-semibold text-red-700">Sil</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
