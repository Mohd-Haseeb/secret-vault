import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { RootStackParamList } from '../../App';
import {
  ClipboardTimeoutOption,
  LockTimeoutOption,
} from '../types';
import { useVault } from '../vault/VaultProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const lockOptions: { value: LockTimeoutOption; label: string }[] = [
  { value: 'immediate', label: 'Immediate' },
  { value: '15s', label: '15s' },
  { value: '30s', label: '30s' },
  { value: '60s', label: '60s' },
];

const clipboardOptions: { value: ClipboardTimeoutOption; label: string }[] = [
  { value: '15s', label: '15s' },
  { value: '45s', label: '45s' },
  { value: '90s', label: '90s' },
];

const SettingsScreen: React.FC<Props> = () => {
  const { settings, updateSettings, supportsRuntimeDeviceAuth } = useVault();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <View style={styles.row}>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>Require auth on every reveal</Text>
              <Text style={styles.rowSubtitle}>
                Prompts for device security before reveal, copy, edit, pin, and
                delete. In Expo Go this cannot be fully tested.
              </Text>
            </View>
            <Switch
              value={settings.requireAuthOnReveal}
              onValueChange={(value) =>
                void updateSettings({ requireAuthOnReveal: value })
              }
              disabled={!supportsRuntimeDeviceAuth}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>Block screenshots</Text>
              <Text style={styles.rowSubtitle}>
                Prevents screenshots and screen recordings in supported builds.
                Expo Go may not reflect production behavior here.
              </Text>
            </View>
            <Switch
              value={settings.blockScreenshots}
              onValueChange={(value) =>
                void updateSettings({ blockScreenshots: value })
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lock timeout</Text>
          <View style={styles.chipRow}>
            {lockOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.chip,
                  settings.lockTimeout === option.value && styles.chipActive,
                ]}
                onPress={() =>
                  void updateSettings({ lockTimeout: option.value })
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    settings.lockTimeout === option.value &&
                      styles.chipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clipboard clear timeout</Text>
          <View style={styles.chipRow}>
            {clipboardOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.chip,
                  settings.clipboardTimeout === option.value &&
                    styles.chipActive,
                ]}
                onPress={() =>
                  void updateSettings({ clipboardTimeout: option.value })
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    settings.clipboardTimeout === option.value &&
                      styles.chipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About your data</Text>
          <Text style={styles.aboutText}>
            Secrets stay local to this device. There is no account, sync
            service, or remote backup in this app. If the device is lost,
            reinstalled, or reset, your vault may be lost unless you build your
            own migration path later.
          </Text>
          <Text style={styles.aboutText}>
            Export and import are intentionally not enabled right now because
            they create a second high-value artifact outside the vault.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#06111f',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
    gap: 16,
  },
  section: {
    backgroundColor: '#101826',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#22324d',
  },
  sectionTitle: {
    color: '#f7fbff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    color: '#f6f7fb',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  rowSubtitle: {
    color: '#a7b7cf',
    fontSize: 13,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#19263b',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#243754',
  },
  chipActive: {
    backgroundColor: '#d5ff5f',
    borderColor: '#d5ff5f',
  },
  chipText: {
    color: '#dde7f6',
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#1b2a03',
  },
  aboutText: {
    color: '#a7b7cf',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
});
