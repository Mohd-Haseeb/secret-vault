import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GlassBackdrop from './src/components/GlassBackdrop';
import VaultLockOverlay from './src/components/VaultLockOverlay';
import UndoBanner from './src/components/UndoBanner';
import SecretDetailScreen from './src/screens/SecretDetailScreen';
import SecretEditorScreen from './src/screens/SecretEditorScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import VaultListScreen from './src/screens/VaultListScreen';
import { SecretDraft } from './src/types';
import { VaultProvider } from './src/vault/VaultProvider';

export type RootStackParamList = {
  VaultList: undefined;
  SecretDetail: { secretID: string };
  SecretEditor: { draft?: SecretDraft } | undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <VaultProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <View style={styles.container}>
            <GlassBackdrop />
            <Stack.Navigator
              screenOptions={{
                // On iOS the system draws the Liquid Glass navigation bar;
                // a custom header background would switch it off.
                ...(Platform.OS === 'ios'
                  ? { headerTransparent: false }
                  : { headerStyle: { backgroundColor: '#0d1b2f' } }),
                headerTintColor: '#f7fbff',
                headerShadowVisible: false,
                contentStyle: { backgroundColor: 'transparent' },
              }}
            >
              <Stack.Screen
                name="VaultList"
                component={VaultListScreen}
                options={{ title: 'Secret Vault' }}
              />
              <Stack.Screen
                name="SecretDetail"
                component={SecretDetailScreen}
                options={{ title: 'Secret Detail' }}
              />
              <Stack.Screen
                name="SecretEditor"
                component={SecretEditorScreen}
                options={({ route }) => ({
                  title: route.params?.draft ? 'Edit Secret' : 'New Secret',
                })}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: 'Settings' }}
              />
            </Stack.Navigator>
            <VaultLockOverlay />
            <UndoBanner />
          </View>
        </NavigationContainer>
      </VaultProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06111f',
  },
});
