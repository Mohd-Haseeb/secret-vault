import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useVault } from '../vault/VaultProvider';

const UndoBanner: React.FC = () => {
  const { hasPendingUndo, undoDelete } = useVault();

  if (!hasPendingUndo) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Secret deleted</Text>
      <Pressable style={styles.button} onPress={undoDelete}>
        <Text style={styles.buttonText}>Undo</Text>
      </Pressable>
    </View>
  );
};

export default UndoBanner;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: '#f7f2e8',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d8d0c0',
  },
  text: {
    color: '#22324d',
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#16243a',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#f8fbff',
    fontSize: 13,
    fontWeight: '800',
  },
});
