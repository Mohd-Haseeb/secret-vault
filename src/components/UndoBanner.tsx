import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import GlassSurface from './GlassSurface';
import { useVault } from '../vault/VaultProvider';

const UndoBanner: React.FC = () => {
  const { hasPendingUndo, undoDelete } = useVault();

  if (!hasPendingUndo) {
    return null;
  }

  return (
    <GlassSurface style={styles.container} tintColor="rgba(247, 242, 232, 0.35)">
      <Text style={styles.text}>Secret deleted</Text>
      <Pressable style={styles.button} onPress={undoDelete}>
        <Text style={styles.buttonText}>Undo</Text>
      </Pressable>
    </GlassSurface>
  );
};

export default UndoBanner;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    color: '#f7fbff',
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#d5ff5f',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#1b2a03',
    fontSize: 13,
    fontWeight: '800',
  },
});
