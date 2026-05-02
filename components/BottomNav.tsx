import { useRouter } from 'expo-router';
import { Home, Package, User } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'home' | 'orders' | 'account';

type Props = {
  role: 'customer' | 'vendor';
  active: Tab;
};

export function BottomNav({ role, active }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const base = role === 'customer' ? '/(customer)' : '/(vendor)';

  const tabs: { id: Tab; label: string; Icon: typeof Home; href: string }[] = [
    { id: 'home', label: 'Anasayfa', Icon: Home, href: base },
    { id: 'orders', label: 'Siparişler', Icon: Package, href: `${base}/orders` },
    { id: 'account', label: 'Hesabım', Icon: User, href: `${base}/profile` },
  ];

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingBottom: insets.bottom,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        {tabs.map(({ id, label, Icon, href }) => {
          const isActive = active === id;
          return (
            <Pressable
              key={id}
              onPress={() => router.replace(href as any)}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }}
            >
              <Icon size={22} color={isActive ? '#0EA5E9' : '#94A3B8'} />
              <Text
                style={{
                  fontSize: 11,
                  marginTop: 2,
                  color: isActive ? '#0EA5E9' : '#94A3B8',
                  fontWeight: isActive ? '600' : '400',
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
