import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/lib/auth';

export default function Index() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/role-select" />;
  if (!profile) return <Redirect href="/(auth)/role-select" />;

  return <Redirect href={profile.role === 'vendor' ? '/(vendor)' : '/(customer)'} />;
}
