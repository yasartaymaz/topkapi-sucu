import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/lib/auth';

export default function Index() {
  const { loading, session, profile } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/role-select" />;
  }

  if (!profile) {
    // Oturum var ama profile satırı yok — rol seçim ekranına dön, oradan signup flow'u profili oluşturacak
    return <Redirect href="/(auth)/role-select" />;
  }

  if (profile.role === 'customer') {
    return <Redirect href="/(customer)" />;
  }

  if (profile.role === 'vendor') {
    return <Redirect href="/(vendor)" />;
  }

  return <Redirect href="/(auth)/role-select" />;
}
