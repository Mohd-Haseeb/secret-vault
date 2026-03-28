import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RootStackParamList } from '../../App';
import { SecretDraft } from '../types';
import { emptySecretDraft, useVault } from '../vault/VaultProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'SecretEditor'>;

const SecretEditorScreen: React.FC<Props> = ({ navigation, route }) => {
  const { saveDraft, deviceSecurityWarning, clearWarning } = useVault();
  const [draft, setDraft] = useState<SecretDraft>(route.params?.draft ?? emptySecretDraft);

  useEffect(() => {
    setDraft(route.params?.draft ?? emptySecretDraft);
  }, [route.params?.draft]);

  const updateDraft = (field: keyof SecretDraft, value: string) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    const didSave = await saveDraft(draft);
    if (!didSave) {
      return;
    }

    Keyboard.dismiss();
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.composer}>
          <Text style={styles.sectionLabel}>
            {draft.id ? 'Edit entry' : 'Create entry'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Label"
            placeholderTextColor="#7a869b"
            value={draft.label}
            onChangeText={(value) => updateDraft('label', value)}
            returnKeyType="next"
          />

          <TextInput
            style={styles.input}
            placeholder="Secret value"
            placeholderTextColor="#7a869b"
            value={draft.secret}
            onChangeText={(value) => updateDraft('secret', value)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Optional notes"
            placeholderTextColor="#7a869b"
            value={draft.notes}
            onChangeText={(value) => updateDraft('notes', value)}
            multiline
          />

          <TextInput
            style={styles.input}
            placeholder="Tags, separated by commas"
            placeholderTextColor="#7a869b"
            value={draft.tags}
            onChangeText={(value) => updateDraft('tags', value)}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Collection or folder"
            placeholderTextColor="#7a869b"
            value={draft.collection}
            onChangeText={(value) => updateDraft('collection', value)}
          />

          <View style={styles.actions}>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {draft.id ? 'Update secret' : 'Save to this device'}
              </Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>

          {deviceSecurityWarning ? (
            <Pressable style={styles.warningCard} onPress={clearWarning}>
              <Text style={styles.warningText}>{deviceSecurityWarning}</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};

export default SecretEditorScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#06111f',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  composer: {
    backgroundColor: '#f7f2e8',
    borderRadius: 28,
    padding: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#546276',
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d8d0c0',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#182230',
    marginBottom: 12,
  },
  notesInput: {
    minHeight: 82,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#16243a',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#f8fbff',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelButton: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#eadfcb',
  },
  cancelButtonText: {
    color: '#4d5b6c',
    fontSize: 15,
    fontWeight: '700',
  },
  warningCard: {
    backgroundColor: '#f7ead2',
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
  },
  warningText: {
    color: '#724200',
    fontSize: 13,
    lineHeight: 18,
  },
});
