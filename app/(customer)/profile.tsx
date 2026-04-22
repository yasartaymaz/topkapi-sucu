import { Link, Stack, useRouter } from 'expo-router';
import { ChevronLeft, LogOut, MapPin, Package } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';

export default function CustomerProfile() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center border-b border-slate-100 bg-white px-3 py-3">
        <Pressable onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <Text className="ml-1 flex-1 text-lg font-bold text-slate-900">Profil</Text>
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

      <View className="mt-4 gap-1 px-3">
        <Link href="/(customer)/addresses" asChild>
          <Pressable className="flex-row items-center rounded-2xl bg-white p-4 active:bg-slate-50">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <MapPin size={18} color="#0369A1" />
            </View>
            <Text className="ml-3 flex-1 text-base font-semibold text-slate-900">
              Adreslerim
            </Text>
          </Pressable>
        </Link>

        <Link href="/(customer)/orders" asChild>
          <Pressable className="flex-row items-center rounded-2xl bg-white p-4 active:bg-slate-50">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <Package size={18} color="#0369A1" />
            </View>
            <Text className="ml-3 flex-1 text-base font-semibold text-slate-900">
              Siparişlerim
            </Text>
          </Pressable>
        </Link>

        <Pressable
          onPress={signOut}
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
    </SafeAreaView>
  );
}
