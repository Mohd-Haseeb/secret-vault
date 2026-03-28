import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RootStackParamList } from '../../App';
import { useVault } from '../vault/VaultProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'SecretDetail'>;

const SecretDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    entries,
    lockVersion,
    deviceSecurityWarning,
    clearWarning,
    revealSecret,
    copySecret,
    loadDraftForEditing,
    deleteSecret,
    togglePinned,
  } = useVault();
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const entry = entries.find((item) => item.id === route.params.secretID);

  useEffect(() => {
    setRevealedSecret(null);
  }, [lockVersion, entry?.updatedAt]);

  useEffect(() => {
    if (!entry) {
      navigation.goBack();
    }
  }, [entry, navigation]);

  if (!entry) {
    return null;
  }

  const handleReveal = async () => {
    if (revealedSecret) {
      setRevealedSecret(null);
      return;
    }

    setIsBusy(true);
    const secret = await revealSecret(entry.id);
    setRevealedSecret(secret);
    setIsBusy(false);
  };

  const handleCopy = async () => {
    setIsBusy(true);
    await copySecret(entry.id);
    setIsBusy(false);
  };

  const handleEdit = async () => {
    setIsBusy(true);
    const draft = await loadDraftForEditing(entry);
    setIsBusy(false);
    if (!draft) {
      return;
    }

    navigation.navigate('SecretEditor', { draft });
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete secret?',
      'The secret will be removed from the vault. You can undo this for a few seconds after deletion.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsBusy(true);
            const didDelete = await deleteSecret(entry.id);
            setIsBusy(false);
            if (didDelete) {
              navigation.goBack();
            }
          },
        },
      ],
    );
  };

  const handlePinnedToggle = async () => {
    setIsBusy(true);
    await togglePinned(entry);
    setIsBusy(false);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{entry.label}</Text>
              {entry.collection ? (
                <Text style={styles.collectionBadge}>{entry.collection}</Text>
              ) : null}
              <Text style={styles.meta}>
                Created {new Date(entry.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.meta}>
                Updated {new Date(entry.updatedAt).toLocaleDateString()}
              </Text>
            </View>
            {entry.pinned ? <Text style={styles.pinBadge}>Pinned</Text> : null}
          </View>

          {entry.tags.length > 0 ? (
            <View style={styles.tagRow}>
              {entry.tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.secretBox}>
            <Text style={styles.secretValue}>
              {revealedSecret ?? 'Protected by device authentication'}
            </Text>
          </View>

          {entry.notes ? <Text style={styles.notes}>{entry.notes}</Text> : null}

          <View style={styles.primaryActions}>
            <Pressable
              style={styles.primaryButton}
              onPress={handleReveal}
              disabled={isBusy}
            >
              <Text style={styles.primaryButtonText}>
                {revealedSecret ? 'Hide secret' : 'Reveal secret'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={handleCopy}
              disabled={isBusy}
            >
              <Text style={styles.secondaryButtonText}>Copy</Text>
            </Pressable>
          </View>

          {deviceSecurityWarning ? (
            <Pressable style={styles.infoCard} onPress={clearWarning}>
              <Text style={styles.infoText}>{deviceSecurityWarning}</Text>
            </Pressable>
          ) : null}

          <View style={styles.secondaryActions}>
            <Pressable
              style={styles.secondaryActionButton}
              onPress={handleEdit}
              disabled={isBusy}
            >
              <Text style={styles.secondaryActionText}>Edit</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryActionButton}
              onPress={handlePinnedToggle}
              disabled={isBusy}
            >
              <Text style={styles.secondaryActionText}>
                {entry.pinned ? 'Unpin' : 'Pin'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.destructiveButton}
              onPress={handleDelete}
              disabled={isBusy}
            >
              <Text style={styles.destructiveText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SecretDetailScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#06111f',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#101826',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#22324d',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    color: '#f7fbff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  meta: {
    color: '#9aa9c2',
    fontSize: 12,
    marginBottom: 4,
  },
  collectionBadge: {
    alignSelf: 'flex-start',
    color: '#16243a',
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: '#f7f2e8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 8,
  },
  pinBadge: {
    color: '#1b2a03',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: '#d5ff5f',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: '#1a2638',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2c3d5b',
  },
  tagText: {
    color: '#b8c7de',
    fontSize: 12,
    fontWeight: '700',
  },
  secretBox: {
    backgroundColor: '#0a1220',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1c2a41',
  },
  secretValue: {
    color: '#f6f7fb',
    fontSize: 15,
    lineHeight: 21,
  },
  notes: {
    color: '#c0cbe0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  infoCard: {
    backgroundColor: '#f7ead2',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  infoText: {
    color: '#724200',
    fontSize: 13,
    lineHeight: 18,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#d5ff5f',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#1b2a03',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#19263b',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#243754',
  },
  secondaryButtonText: {
    color: '#dde7f6',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  secondaryActionButton: {
    backgroundColor: '#19263b',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#243754',
  },
  secondaryActionText: {
    color: '#dde7f6',
    fontWeight: '700',
    fontSize: 14,
  },
  destructiveButton: {
    backgroundColor: '#251724',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  destructiveText: {
    color: '#ff8ea1',
    fontWeight: '700',
    fontSize: 14,
  },
});
