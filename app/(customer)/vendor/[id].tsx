import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Clock, Package, ShoppingCart, Star, Store, Truck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { formatTL, formatTime } from '@/lib/format';
import { sendOrderEvent } from '@/lib/orderEvents';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

type Vendor = {
  id: string;
  shop_name: string;
  phone: string | null;
  logo_path: string | null;
  delivery_fee: number;
  opens_at: string;
  closes_at: string;
};

type Product = {
  id: string;
  name: string;
  brand: string | null;
  volume_liters: number | null;
  price: number;
  image_path: string | null;
  stock_status: string;
};

export default function VendorDetail() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vendorId = id ?? null;

  const [orderProduct, setOrderProduct] = useState<Product | null>(null);

  const { data: vendor, isLoading } = useQuery({
    queryKey: qk.vendor(vendorId),
    enabled: !!vendorId,
    queryFn: async (): Promise<Vendor | null> => {
      const { data, error } = await supabase
        .from('vendors_active' as any)
        .select('id, shop_name, phone, logo_path, delivery_fee, opens_at, closes_at')
        .eq('id', vendorId!)
        .maybeSingle();
      if (error) throw error;
      return data as Vendor | null;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: qk.vendorProducts(vendorId),
    enabled: !!vendorId,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products_active' as any)
        .select('id, name, brand, volume_liters, price, image_path, stock_status')
        .eq('vendor_id', vendorId!)
        .order('name');
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const { data: rating } = useQuery({
    queryKey: qk.vendorReviewSummary(vendorId),
    enabled: !!vendorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews_active' as any)
        .select('rating')
        .eq('vendor_id', vendorId!);
      if (error) throw error;
      const list = (data ?? []) as { rating: number }[];
      if (list.length === 0) return { avg: 0, count: 0 };
      const avg = list.reduce((s, r) => s + Number(r.rating), 0) / list.length;
      return { avg, count: list.length };
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center border-b border-slate-100 bg-white px-3 py-3">
        <Pressable onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <Text className="ml-1 flex-1 text-base font-bold text-slate-900" numberOfLines={1}>
          {vendor?.shop_name ?? 'Sucu'}
        </Text>
      </View>

      {isLoading || !vendor ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 20, gap: 10 }}
          ListHeaderComponent={
            <View className="mb-4 rounded-2xl bg-white p-5">
              <View className="flex-row items-center">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-100">
                  <Store size={28} color="#0369A1" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-xl font-bold text-slate-900">
                    {vendor.shop_name}
                  </Text>
                  {rating && rating.count > 0 ? (
                    <View className="mt-1 flex-row items-center">
                      <Star size={14} color="#F59E0B" fill="#F59E0B" />
                      <Text className="ml-1 text-sm font-semibold text-slate-700">
                        {rating.avg.toFixed(1)}
                      </Text>
                      <Text className="ml-1 text-xs text-slate-500">
                        ({rating.count} değerlendirme)
                      </Text>
                    </View>
                  ) : (
                    <Text className="mt-1 text-xs text-slate-500">
                      Henüz değerlendirme yok
                    </Text>
                  )}
                </View>
              </View>

              <View className="mt-4 flex-row gap-3">
                <View className="flex-1 flex-row items-center rounded-xl bg-slate-50 p-3">
                  <Clock size={16} color="#64748B" />
                  <Text className="ml-2 text-xs text-slate-700">
                    {formatTime(vendor.opens_at)}–{formatTime(vendor.closes_at)}
                  </Text>
                </View>
                <View className="flex-1 flex-row items-center rounded-xl bg-slate-50 p-3">
                  <Truck size={16} color="#64748B" />
                  <Text className="ml-2 text-xs text-slate-700">
                    {Number(vendor.delivery_fee) > 0
                      ? `${formatTL(vendor.delivery_fee)}`
                      : 'Ücretsiz'}
                  </Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center rounded-2xl bg-white p-8">
              <Package size={28} color="#94A3B8" />
              <Text className="mt-2 text-base font-semibold text-slate-900">
                Ürün yok
              </Text>
              <Text className="mt-1 text-center text-sm text-slate-500">
                Bu sucu henüz ürün eklememiş.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const outOfStock = item.stock_status === 'out_of_stock';
            return (
              <View className="flex-row items-center rounded-2xl bg-white p-3">
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
                  <Text className="mt-1 text-base font-bold text-brand-700">
                    {formatTL(item.price)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    if (outOfStock) {
                      Alert.alert('Stok yok', 'Bu ürün şu anda stokta değil.');
                      return;
                    }
                    setOrderProduct(item);
                  }}
                  disabled={outOfStock}
                  className={`h-10 items-center justify-center rounded-full px-4 ${outOfStock ? 'bg-slate-200' : 'bg-brand-500 active:bg-brand-600'}`}
                >
                  <ShoppingCart size={18} color={outOfStock ? '#94A3B8' : '#fff'} />
                </Pressable>
              </View>
            );
          }}
        />
      )}

      <OrderModal
        product={orderProduct}
        vendor={vendor ?? null}
        customerId={user?.id ?? null}
        customerName={profile?.full_name ?? null}
        customerPhone={profile?.phone ?? null}
        onClose={() => setOrderProduct(null)}
        onPlaced={(orderId) => {
          setOrderProduct(null);
          queryClient.invalidateQueries({ queryKey: qk.myCustomerOrders(user?.id ?? null) });
          router.push({ pathname: '/(customer)/order/[id]', params: { id: orderId } });
        }}
      />
    </SafeAreaView>
  );
}

function OrderModal({
  product,
  vendor,
  customerId,
  customerName,
  customerPhone,
  onClose,
  onPlaced,
}: {
  product: Product | null;
  vendor: Vendor | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  onClose: () => void;
  onPlaced: (orderId: string) => void;
}) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: defaultAddress } = useQuery({
    queryKey: qk.defaultAddress(customerId),
    enabled: !!customerId && !!product,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_addresses_active' as any)
        .select(
          'id, label, full_address, neighborhood_id, neighborhoods_active!inner(name, districts_active!inner(name))'
        )
        .eq('customer_profile_id', customerId!)
        .eq('is_default', true)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const subtotal = useMemo(
    () => (product ? Number(product.price) * qty : 0),
    [product, qty]
  );
  const deliveryFee = vendor ? Number(vendor.delivery_fee) : 0;
  const total = subtotal + deliveryFee;

  const placeOrder = async () => {
    if (!customerId || !product || !vendor || !defaultAddress) {
      Alert.alert('Eksik bilgi', 'Adres seçili olmalı.');
      return;
    }
    setSubmitting(true);

    const addressSnapshot = {
      address_id: defaultAddress.id,
      label: defaultAddress.label,
      neighborhood_id: defaultAddress.neighborhood_id,
      neighborhood_name: defaultAddress.neighborhoods_active?.name,
      district_name: defaultAddress.neighborhoods_active?.districts_active?.name,
      full_address: defaultAddress.full_address,
    };

    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_profile_id: customerId,
        customer_name_snapshot: customerName,
        customer_phone_snapshot: customerPhone,
        vendor_id: vendor.id,
        product_id: product.id,
        product_name_snapshot: product.name,
        unit_price_snapshot: Number(product.price),
        qty,
        delivery_fee_snapshot: deliveryFee,
        subtotal,
        total,
        address_snapshot: addressSnapshot,
        status: 'pending',
        customer_note: note.trim() || null,
      })
      .select('id')
      .maybeSingle();

    if (error || !data) {
      setSubmitting(false);
      Alert.alert('Sipariş oluşturulamadı', error?.message ?? 'Hata');
      return;
    }

    // order_status_history kaydı
    await supabase.from('order_status_history').insert({
      order_id: data.id,
      status: 'pending',
      changed_by: customerId,
    });

    // Sucuya bildirim gönder (arka planda, blocking değil)
    sendOrderEvent(data.id, 'new_order');

    setSubmitting(false);
    setQty(1);
    setNote('');
    onPlaced(data.id);
  };

  if (!product || !vendor) return null;

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-row items-center border-b border-slate-100 px-4 py-3">
          <Text className="flex-1 text-lg font-bold text-slate-900">
            Siparişi onayla
          </Text>
          <Pressable onPress={onClose} className="px-2 py-1">
            <Text className="text-base text-slate-600">Vazgeç</Text>
          </Pressable>
        </View>

        <View className="flex-1 px-5 py-5">
          <View className="rounded-2xl bg-slate-50 p-4">
            <Text className="text-xs font-semibold uppercase text-slate-500">
              Ürün
            </Text>
            <Text className="mt-1 text-lg font-bold text-slate-900">
              {product.name}
            </Text>
            <Text className="text-sm text-slate-500">
              {product.brand ? `${product.brand} • ` : ''}
              {product.volume_liters ? `${product.volume_liters} L • ` : ''}
              {formatTL(product.price)} / adet
            </Text>

            <View className="mt-4 flex-row items-center">
              <Text className="text-sm font-semibold text-slate-700">Adet</Text>
              <View className="ml-auto flex-row items-center gap-3">
                <Pressable
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                  className="h-10 w-10 items-center justify-center rounded-full bg-white active:bg-slate-100"
                >
                  <Text className="text-2xl font-semibold text-slate-900">
                    −
                  </Text>
                </Pressable>
                <Text className="min-w-8 text-center text-lg font-bold text-slate-900">
                  {qty}
                </Text>
                <Pressable
                  onPress={() => setQty((q) => q + 1)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-brand-500 active:bg-brand-600"
                >
                  <Text className="text-2xl font-semibold text-white">+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View className="mt-4 rounded-2xl bg-slate-50 p-4">
            <Text className="text-xs font-semibold uppercase text-slate-500">
              Teslimat adresi
            </Text>
            {defaultAddress ? (
              <>
                <Text className="mt-1 text-sm font-semibold text-slate-900">
                  {defaultAddress.label} —{' '}
                  {defaultAddress.neighborhoods_active?.name} /{' '}
                  {defaultAddress.neighborhoods_active?.districts_active?.name}
                </Text>
                <Text className="text-xs text-slate-600" numberOfLines={2}>
                  {defaultAddress.full_address}
                </Text>
              </>
            ) : (
              <Text className="mt-1 text-sm text-red-700">
                Varsayılan adres yok. Önce adres ekle.
              </Text>
            )}
          </View>

          <View className="mt-4">
            <Text className="mb-1 text-sm font-medium text-slate-700">
              Not (opsiyonel)
            </Text>
            <TextInput
              className="min-h-20 rounded-xl border border-slate-200 bg-slate-50 p-4 text-base text-slate-900"
              placeholder="Sucuya iletmek istediğin bir not"
              placeholderTextColor="#94A3B8"
              value={note}
              onChangeText={setNote}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View className="mt-auto rounded-2xl bg-slate-50 p-4">
            <Row label="Ara toplam" value={formatTL(subtotal)} />
            <Row label="Teslim ücreti" value={deliveryFee > 0 ? formatTL(deliveryFee) : 'Ücretsiz'} />
            <View className="my-2 h-px bg-slate-200" />
            <Row label="Toplam" value={formatTL(total)} bold />
          </View>

          <Pressable
            onPress={placeOrder}
            disabled={submitting || !defaultAddress}
            className="mt-4 h-14 items-center justify-center rounded-2xl bg-brand-500 active:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-lg font-semibold text-white">
                Siparişi ver
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className={`text-sm ${bold ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
        {label}
      </Text>
      <Text className={`text-sm ${bold ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
        {value}
      </Text>
    </View>
  );
}
