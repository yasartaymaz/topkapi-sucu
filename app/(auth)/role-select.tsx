import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelect() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-between px-6 py-10">
        <View className="items-center pt-16">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-100">
            <Text className="text-5xl">💧</Text>
          </View>
          <Text className="mt-6 text-4xl font-bold text-brand-700">Sucu</Text>
          <Text className="mt-2 text-center text-base text-slate-500">
            Kapına kadar su
          </Text>
        </View>

        <View className="gap-4">
          <Text className="text-center text-base text-slate-700">
            Hangisisin?
          </Text>

          <Link href="/(auth)/login?role=customer" asChild>
            <Pressable className="h-14 items-center justify-center rounded-2xl bg-brand-500 active:bg-brand-600">
              <Text className="text-lg font-semibold text-white">
                Müşteriyim
              </Text>
            </Pressable>
          </Link>

          <Link href="/(auth)/login?role=vendor" asChild>
            <Pressable className="h-14 items-center justify-center rounded-2xl border border-brand-500 bg-white active:bg-brand-50">
              <Text className="text-lg font-semibold text-brand-700">
                Sucuyum
              </Text>
            </Pressable>
          </Link>

          <Text className="mt-2 text-center text-xs text-slate-400">
            Giriş yaparak uygulamanın kullanım koşullarını kabul etmiş olursun.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
