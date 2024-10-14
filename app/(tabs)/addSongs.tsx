import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Song {
    id: string;
    title: string;
    artist: string;
    uri: string;
}

export default function AddSongs() {
    const [songs, setSongs] = useState<Song[]>([]);
    const navigation = useNavigation();

    useEffect(() => {
        loadSongs();
    }, []);

    const loadSongs = async () => {
        try {
            const storedSongs = await AsyncStorage.getItem('songs');
            if (storedSongs) {
                setSongs(JSON.parse(storedSongs));
            }
        } catch (error) {
            console.error('Error loading songs:', error);
            Alert.alert('Error', 'Failed to load songs');
        }
    };

    const addSong = async () => {
        try {
            console.log('Starting song selection...');
            const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: false,
            });
            console.log('Document picker result:', result);

            if (result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const newSong: Song = {
                    id: Date.now().toString(),
                    title: asset.name,
                    artist: 'Unknown',
                    uri: asset.uri,
                };

                console.log('New song object:', newSong);

                const updatedSongs = [...songs, newSong];
                console.log('Updated songs array:', updatedSongs);
                setSongs(updatedSongs);
                await AsyncStorage.setItem('songs', JSON.stringify(updatedSongs));
                console.log('Songs saved to AsyncStorage');
                Alert.alert('Success', `Added song: ${asset.name}`);
            } else {
                console.log('User cancelled the picker or no asset was selected');
            }
        } catch (error) {
            console.error('Error adding song:', error);
            Alert.alert('Error', 'Failed to add song');
        }
    };

    const goToPlayer = () => {
        navigation.navigate('player');
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.title}>Add Songs</ThemedText>
            <TouchableOpacity style={styles.addButton} onPress={addSong}>
                <ThemedText style={styles.addButtonText}>Add Song</ThemedText>
            </TouchableOpacity>
            <FlatList
                data={songs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ThemedView style={styles.songItem}>
                        <ThemedText>{item.title}</ThemedText>
                    </ThemedView>
                )}
            />
            <TouchableOpacity style={styles.playerButton} onPress={goToPlayer}>
                <ThemedText style={styles.playerButtonText}>Go to Player</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 60, // Add this line to increase top padding
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    addButton: {
        backgroundColor: '#0a7ea4',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
    },
    addButtonText: {
        color: 'white',
        textAlign: 'center',
    },
    songItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    playerButton: {
        backgroundColor: '#0a7ea4',
        padding: 10,
        borderRadius: 5,
        marginTop: 20,
    },
    playerButtonText: {
        color: 'white',
        textAlign: 'center',
    },
});
