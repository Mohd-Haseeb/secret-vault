import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useVault } from '../vault/VaultProvider';

const VaultLockOverlay: React.FC = () => {
  const { isLoading, sessionLocked, supportsRuntimeDeviceAuth, unlockVault } =
    useVault();

  if (!isLoading && !sessionLocked) {
    return null;
  }

  return (
    <View style={styles.lockOverlay}>
      <View style={styles.lockCard}>
        <Text style={styles.lockTitle}>
          {isLoading ? 'Preparing vault' : 'Vault locked'}
        </Text>
        <Text style={styles.lockSubtitle}>
          {isLoading
            ? 'Loading secure storage on this device.'
            : supportsRuntimeDeviceAuth
              ? 'The app was locked after leaving the foreground. Unlock with the phone security prompt.'
              : 'This device does not have app authentication available right now. Unlock will only dismiss the privacy screen.'}
        </Text>
        {!isLoading ? (
          <Pressable style={styles.unlockButton} onPress={unlockVault}>
            <Text style={styles.unlockButtonText}>Unlock vault</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

export default VaultLockOverlay;

const styles = StyleSheet.create({
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 10, 19, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  lockCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#101826',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#22324d',
  },
  lockTitle: {
    color: '#f7fbff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  lockSubtitle: {
    color: '#a7b7cf',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  unlockButton: {
    backgroundColor: '#d5ff5f',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  unlockButtonText: {
    color: '#1b2a03',
    fontWeight: '800',
    fontSize: 15,
  },
});
