import { StyleSheet } from 'react-native';
import { Link } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { HelloWave } from '@/components/HelloWave';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Starlord's Walkman!</ThemedText>
      <HelloWave />
      <ThemedView style={styles.infoContainer}>
        <ThemedText style={styles.infoText}>
          Listen to music during coding
        </ThemedText>
      </ThemedView>
      <Link href="/player" style={styles.link}>
        <ThemedText style={styles.linkText}>Go to Player</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 18,
    color: '#0a7ea4',
  },
});
