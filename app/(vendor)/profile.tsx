import { Link, Stack, useRouter } from 'expo-router';
import { LogOut, MapPin, Package, Settings, ShoppingBag } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/lib/auth';

export default function VendorProfile() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/role-select');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="border-b border-slate-100 bg-white px-5 py-4">
        <Text className="text-xl font-bold text-slate-900">Hesabım</Text>
      </View>

      <View className="bg-white px-5 py-6">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-100">
          <Text className="text-2xl font-bold text-brand-700">
            {(profile?.full_name ?? '?').slice(0, 1).toLocaleUpperCase('tr-TR')}
          </Text>
        </View>
        <Text className="mt-3 text-xl font-bold text-slate-900">
          {profile?.full_name ?? '—'}
        </Text>
        {profile?.phone && (
          <Text className="text-sm text-slate-600">{profile.phone}</Text>
        )}
      </View>

      <View className="mt-4 flex-1 gap-1 px-3">
        <Link href="/(vendor)/shop" asChild>
          <Pressable className="flex-row items-center rounded-2xl bg-white p-4 active:bg-slate-50">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <Settings size={18} color="#0369A1" />
            </View>
            <Text className="ml-3 flex-1 text-base font-semibold text-slate-900">
              Dükkan ayarları
            </Text>
          </Pressable>
        </Link>

        <Link href="/(vendor)/service-areas" asChild>
          <Pressable className="flex-row items-center rounded-2xl bg-white p-4 active:bg-slate-50">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <MapPin size={18} color="#0369A1" />
            </View>
            <Text className="ml-3 flex-1 text-base font-semibold text-slate-900">
              Hizmet bölgem
            </Text>
          </Pressable>
        </Link>

        <Link href="/(vendor)/products" asChild>
          <Pressable className="flex-row items-center rounded-2xl bg-white p-4 active:bg-slate-50">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <Package size={18} color="#0369A1" />
            </View>
            <Text className="ml-3 flex-1 text-base font-semibold text-slate-900">
              Ürünlerim
            </Text>
          </Pressable>
        </Link>

        <Link href="/(vendor)/orders" asChild>
          <Pressable className="flex-row items-center rounded-2xl bg-white p-4 active:bg-slate-50">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <ShoppingBag size={18} color="#0369A1" />
            </View>
            <Text className="ml-3 flex-1 text-base font-semibold text-slate-900">
              Tüm siparişler
            </Text>
          </Pressable>
        </Link>

        <Pressable
          onPress={handleSignOut}
          className="mt-4 flex-row items-center rounded-2xl bg-white p-4 active:bg-slate-50"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <LogOut size={18} color="#B91C1C" />
          </View>
          <Text className="ml-3 flex-1 text-base font-semibold text-red-700">
            Çıkış yap
          </Text>
        </Pressable>
      </View>
      <BottomNav role="vendor" active="account" />
    </SafeAreaView>
  );
}
