import { Link } from 'expo-router';
import { Package, ShoppingBag } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { formatTL, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '@/lib/format';

export type OrderRow = {
  id: string;
  status: string;
  total: number;
  qty: number;
  product_name_snapshot: string;
  created_at: string;
  primaryLabel: string; // vendor: müşteri adı, customer: dükkan adı
};

type Props = {
  orders: OrderRow[];
  role: 'customer' | 'vendor';
  onRefresh?: () => void;
  refreshing?: boolean;
};

type FilterKey = 'all' | 'pending' | 'active' | 'delivered' | 'canceled';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',       label: 'Tümü' },
  { key: 'pending',   label: 'Bekleyen' },
  { key: 'active',    label: 'Aktif' },
  { key: 'delivered', label: 'Tamamlandı' },
  { key: 'canceled',  label: 'İptal' },
];

const STATUS_SORT: Record<string, number> = {
  pending:   0,
  accepted:  1,
  preparing: 2,
  delivering: 3,
  delivered: 4,
  canceled:  5,
};

function matchesFilter(status: string, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'active') return ['accepted', 'preparing', 'delivering'].includes(status);
  if (filter === 'pending') return status === 'pending';
  if (filter === 'delivered') return status === 'delivered';
  if (filter === 'canceled') return status === 'canceled';
  return true;
}

export function OrderList({ orders, role, onRefresh, refreshing }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    return orders
      .filter((o) => matchesFilter(o.status, activeFilter))
      .sort((a, b) => (STATUS_SORT[a.status] ?? 9) - (STATUS_SORT[b.status] ?? 9));
  }, [orders, activeFilter]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: orders.length, pending: 0, active: 0, delivered: 0, canceled: 0 };
    for (const o of orders) {
      if (o.status === 'pending') c.pending++;
      else if (['accepted', 'preparing', 'delivering'].includes(o.status)) c.active++;
      else if (o.status === 'delivered') c.delivered++;
      else if (o.status === 'canceled') c.canceled++;
    }
    return c;
  }, [orders]);

  const detailPath = role === 'customer'
    ? '/(customer)/order/[id]'
    : '/(vendor)/order/[id]';

  return (
    <FlatList
      data={filtered}
      keyExtractor={(o) => o.id}
      onRefresh={onRefresh}
      refreshing={refreshing ?? false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 90, gap: 10 }}
      ListHeaderComponent={
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 16 }}
        >
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            const count = counts[f.key];
            if (count === 0 && f.key !== 'all' && activeFilter !== f.key) return null;
            return (
              <Pressable
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: isActive ? '#0EA5E9' : '#fff',
                  borderWidth: 1,
                  borderColor: isActive ? '#0EA5E9' : '#E2E8F0',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: isActive ? '#fff' : '#475569',
                  }}
                >
                  {f.label}
                </Text>
                {count > 0 && (
                  <View
                    style={{
                      backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : '#F1F5F9',
                      borderRadius: 999,
                      minWidth: 18,
                      height: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: isActive ? '#fff' : '#64748B',
                      }}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      }
      ListEmptyComponent={
        <View className="items-center rounded-2xl bg-white p-8">
          <ShoppingBag size={28} color="#94A3B8" />
          <Text className="mt-2 text-base font-semibold text-slate-900">
            Sipariş yok
          </Text>
          {activeFilter !== 'all' && (
            <Text className="mt-1 text-center text-sm text-slate-500">
              Bu filtrede sipariş bulunmuyor.
            </Text>
          )}
        </View>
      }
      renderItem={({ item }) => {
        const palette = ORDER_STATUS_COLOR[item.status] ?? ORDER_STATUS_COLOR.pending;
        return (
          <Link href={{ pathname: detailPath as any, params: { id: item.id } }} asChild>
            <Pressable className="rounded-2xl bg-white p-4 active:bg-slate-50">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-base font-bold text-slate-900" numberOfLines={1}>
                  {item.primaryLabel}
                </Text>
                <View className={`ml-2 rounded-full px-2 py-0.5 ${palette.bg}`}>
                  <Text className={`text-[11px] font-semibold ${palette.text}`}>
                    {ORDER_STATUS_LABEL[item.status] ?? item.status}
                  </Text>
                </View>
              </View>
              <View className="mt-2 flex-row items-center">
                <Package size={14} color="#64748B" />
                <Text className="ml-1 text-sm text-slate-700">
                  {item.product_name_snapshot} × {item.qty}
                </Text>
              </View>
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-xs text-slate-500">
                  {new Date(item.created_at).toLocaleString('tr-TR', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
                <Text className="text-sm font-bold text-slate-900">
                  {formatTL(item.total)}
                </Text>
              </View>
            </Pressable>
          </Link>
        );
      }}
    />
  );
}
