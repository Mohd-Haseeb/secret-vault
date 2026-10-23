import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RootStackParamList } from '../../App';
import GlassSurface from '../components/GlassSurface';
import { SecretSummary, SortMode } from '../types';
import { useVault } from '../vault/VaultProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'VaultList'>;

const sortModes: { value: SortMode; label: string }[] = [
  { value: 'updated', label: 'Updated' },
  { value: 'alphabetical', label: 'A-Z' },
  { value: 'created', label: 'Created' },
];

const comparators: Record<SortMode, (a: SecretSummary, b: SecretSummary) => number> = {
  alphabetical: (a, b) => a.label.localeCompare(b.label),
  created: (a, b) => b.createdAt.localeCompare(a.createdAt),
  updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
};

type EntryRowProps = {
  entry: SecretSummary;
  showPinBadge?: boolean;
  onOpen: (id: string) => void;
};

const EntryRow = React.memo(function EntryRow({
  entry,
  showPinBadge,
  onOpen,
}: EntryRowProps) {
  return (
    <Pressable onPress={() => onOpen(entry.id)}>
      <GlassSurface style={styles.rowCard}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowTitle}>{entry.label}</Text>
          {showPinBadge ? <Text style={styles.pinBadge}>Pinned</Text> : null}
        </View>
        {entry.collection ? (
          <Text style={styles.rowCollection}>{entry.collection}</Text>
        ) : null}
        {entry.tags.length > 0 ? (
          <Text style={styles.rowTags}>
            {entry.tags.map((tag) => `#${tag}`).join('  ')}
          </Text>
        ) : null}
        <Text style={styles.rowMeta}>
          Updated {new Date(entry.updatedAt).toLocaleDateString()}
        </Text>
      </GlassSurface>
    </Pressable>
  );
});

const VaultListScreen: React.FC<Props> = ({ navigation }) => {
  const { entries, statusMessage, clearStatusMessage } = useVault();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('updated');

  const allTags = useMemo(
    () =>
      Array.from(new Set(entries.flatMap((entry) => entry.tags))).sort((left, right) =>
        left.localeCompare(right),
      ),
    [entries],
  );
  const allCollections = useMemo(
    () =>
      Array.from(
        new Set(
          entries
            .map((entry) => entry.collection)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [entries],
  );

  const filteredEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesTag = !activeTag || entry.tags.includes(activeTag);
      const matchesCollection =
        !activeCollection || entry.collection === activeCollection;
      const searchableText = [entry.label, entry.notes ?? '', entry.tags.join(' ')]
        .join(' ')
        .toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

      return matchesTag && matchesCollection && matchesQuery;
    });
  }, [activeCollection, activeTag, entries, searchQuery]);

  const { pinnedEntries, otherEntries } = useMemo(() => {
    const sorted = [...filteredEntries].sort(comparators[sortMode]);
    return {
      pinnedEntries: sorted.filter((entry) => entry.pinned),
      otherEntries: sorted.filter((entry) => !entry.pinned),
    };
  }, [filteredEntries, sortMode]);

  const openEntry = useCallback(
    (secretID: string) => navigation.navigate('SecretDetail', { secretID }),
    [navigation],
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <GlassSurface style={styles.hero}>
          <Text style={styles.subtitle}>
            Browse your secrets, pin the important ones, and keep the editor out
            of the way until you need it.
          </Text>
          <View style={styles.heroActions}>
            <Pressable
              style={styles.addButton}
              onPress={() => navigation.navigate('SecretEditor')}
            >
              <Text style={styles.addButtonText}>Add secret</Text>
            </Pressable>
            <Pressable
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.settingsButtonText}>Settings</Text>
            </Pressable>
          </View>
        </GlassSurface>

        <View style={styles.toolbar}>
          <TextInput
            style={styles.searchInput}
            clearButtonMode="while-editing"
            placeholder="Search labels, notes, and tags"
            placeholderTextColor="#7f90aa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortRow}
          >
            {sortModes.map((mode) => (
              <Pressable
                key={mode.value}
                style={[
                  styles.sortChip,
                  sortMode === mode.value && styles.sortChipActive,
                ]}
                onPress={() => setSortMode(mode.value)}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    sortMode === mode.value && styles.sortChipTextActive,
                  ]}
                >
                  {mode.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {allTags.length > 0 ? (
            <View style={styles.filterRow}>
              <Pressable
                style={[
                  styles.filterChip,
                  !activeTag && styles.filterChipActive,
                ]}
                onPress={() => setActiveTag(null)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    !activeTag && styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
              </Pressable>

              {allTags.map((tag) => (
                <Pressable
                  key={tag}
                  style={[
                    styles.filterChip,
                    activeTag === tag && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setActiveTag((current) => (current === tag ? null : tag))
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activeTag === tag && styles.filterChipTextActive,
                    ]}
                  >
                    #{tag}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {allCollections.length > 0 ? (
            <View style={styles.collectionRow}>
              <Pressable
                style={[
                  styles.collectionChip,
                  !activeCollection && styles.collectionChipActive,
                ]}
                onPress={() => setActiveCollection(null)}
              >
                <Text
                  style={[
                    styles.collectionChipText,
                    !activeCollection && styles.collectionChipTextActive,
                  ]}
                >
                  All folders
                </Text>
              </Pressable>

              {allCollections.map((collection) => (
                <Pressable
                  key={collection}
                  style={[
                    styles.collectionChip,
                    activeCollection === collection &&
                      styles.collectionChipActive,
                  ]}
                  onPress={() =>
                    setActiveCollection((current) =>
                      current === collection ? null : collection,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.collectionChipText,
                      activeCollection === collection &&
                        styles.collectionChipTextActive,
                    ]}
                  >
                    {collection}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {statusMessage ? (
          <Pressable
            style={[
              styles.noticeCard,
              statusMessage.tone === 'error' && styles.noticeCardError,
              statusMessage.tone === 'success' && styles.noticeCardSuccess,
              statusMessage.tone === 'info' && styles.noticeCardInfo,
            ]}
            onPress={clearStatusMessage}
          >
            <Text
              style={[
                styles.noticeText,
                statusMessage.tone === 'error' && styles.noticeTextError,
                statusMessage.tone === 'success' && styles.noticeTextSuccess,
                statusMessage.tone === 'info' && styles.noticeTextInfo,
              ]}
            >
              {statusMessage.text}
            </Text>
          </Pressable>
        ) : null}

        {entries.length === 0 ? (
          <GlassSurface style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Vault is empty</Text>
            <Text style={styles.emptySubtitle}>
              Add your first secret to start building the vault.
            </Text>
          </GlassSurface>
        ) : filteredEntries.length === 0 ? (
          <GlassSurface style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matching secrets</Text>
            <Text style={styles.emptySubtitle}>
              Adjust the search text or active tag to widen the results.
            </Text>
          </GlassSurface>
        ) : (
          <View style={styles.listSections}>
            {pinnedEntries.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pinned</Text>
                {pinnedEntries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    showPinBadge
                    onOpen={openEntry}
                  />
                ))}
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All secrets</Text>
              {otherEntries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} onOpen={openEntry} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default VaultListScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  hero: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
  },
  subtitle: {
    color: '#adc1db',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  addButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#d5ff5f',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButtonText: {
    color: '#1b2a03',
    fontWeight: '800',
    fontSize: 14,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  settingsButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#19263b',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#243754',
  },
  settingsButtonText: {
    color: '#dde7f6',
    fontWeight: '800',
    fontSize: 14,
  },
  toolbar: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'rgba(16, 24, 38, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#22324d',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#eff5ff',
  },
  sortRow: {
    gap: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
  sortChip: {
    backgroundColor: '#101826',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#22324d',
  },
  sortChipActive: {
    backgroundColor: '#f7f2e8',
    borderColor: '#f7f2e8',
  },
  sortChipText: {
    color: '#d2ddef',
    fontSize: 13,
    fontWeight: '700',
  },
  sortChipTextActive: {
    color: '#152335',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  collectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    backgroundColor: '#101826',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#22324d',
  },
  filterChipActive: {
    backgroundColor: '#d5ff5f',
    borderColor: '#d5ff5f',
  },
  filterChipText: {
    color: '#d2ddef',
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#1b2a03',
  },
  collectionChip: {
    backgroundColor: '#152335',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#28405f',
  },
  collectionChipActive: {
    backgroundColor: '#f7f2e8',
    borderColor: '#f7f2e8',
  },
  collectionChipText: {
    color: '#d7e1ef',
    fontSize: 13,
    fontWeight: '700',
  },
  collectionChipTextActive: {
    color: '#152335',
  },
  noticeCard: {
    backgroundColor: '#f7ead2',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  noticeCardError: {
    backgroundColor: '#f7ead2',
  },
  noticeCardSuccess: {
    backgroundColor: '#ddf5d7',
  },
  noticeCardInfo: {
    backgroundColor: '#d9e8fb',
  },
  noticeText: {
    color: '#724200',
    fontSize: 13,
    lineHeight: 18,
  },
  noticeTextError: {
    color: '#724200',
  },
  noticeTextSuccess: {
    color: '#23581e',
  },
  noticeTextInfo: {
    color: '#1f4b78',
  },
  emptyState: {
    borderRadius: 24,
    padding: 20,
  },
  emptyTitle: {
    color: '#f7fbff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#a7b7cf',
    fontSize: 14,
    lineHeight: 20,
  },
  listSections: {
    gap: 18,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#f7fbff',
    fontSize: 18,
    fontWeight: '800',
  },
  rowCard: {
    borderRadius: 22,
    padding: 16,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  rowTitle: {
    color: '#f6f7fb',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
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
  rowTags: {
    color: '#b8c7de',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  rowCollection: {
    color: '#f4d58a',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  rowMeta: {
    color: '#9aa9c2',
    fontSize: 12,
  },
});
