import React from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSongs } from '@/components/SongsContext';

export default function AddSongs() {
    const { songs, setSongs, loadSongs } = useSongs();
    const navigation = useNavigation();

    React.useEffect(() => {
        loadSongs();
    }, []);

    const handleAddSong = async () => {
        try {
            console.log('Starting song selection...');
            const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: false,
            });
            console.log('Document picker result:', result);

            if (result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const fileName = asset.name.split('.').slice(0, -1).join('.');
                const newSong = {
                    id: Date.now().toString(),
                    title: fileName,
                    artist: 'Unknown Artist',
                    uri: asset.uri,
                };

                console.log('New song object:', newSong);

                const updatedSongs = [...songs, newSong];
                console.log('Updated songs array:', updatedSongs);
                setSongs(updatedSongs);
                await AsyncStorage.setItem('songs', JSON.stringify(updatedSongs));
                console.log('Songs saved to AsyncStorage');
                Alert.alert('Success', `Added song: ${fileName}`);
            } else {
                console.log('User cancelled the picker or no asset was selected');
            }
        } catch (error) {
            console.error('Error adding song:', error);
            Alert.alert('Error', 'Failed to add song');
        }
    };

    const handleGoToPlayer = () => {
        navigation.navigate('player');
    };

    const handleRemoveAllSongs = async () => {
        Alert.alert(
            "Remove All Songs",
            "Are you sure you want to remove all songs?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "OK",
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('songs');
                            setSongs([]);
                            Alert.alert('Success', 'All songs have been removed');
                        } catch (error) {
                            console.error('Error removing songs:', error);
                            Alert.alert('Error', 'Failed to remove songs');
                        }
                    }
                }
            ]
        );
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.title}>Add Songs</ThemedText>
            <TouchableOpacity style={styles.addButton} onPress={handleAddSong}>
                <ThemedText style={styles.addButtonText}>Add Song</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeButton} onPress={handleRemoveAllSongs}>
                <ThemedText style={styles.removeButtonText}>Remove All Songs</ThemedText>
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
            <TouchableOpacity style={styles.playerButton} onPress={handleGoToPlayer}>
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
    removeButton: {
        backgroundColor: '#d9534f',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
    },
    removeButtonText: {
        color: 'white',
        textAlign: 'center',
    },
});
