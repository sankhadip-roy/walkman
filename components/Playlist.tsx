import React from 'react';
import { FlatList, TouchableOpacity, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface Song {
    id: string;
    title: string;
    artist: string;
    uri: string;
}

interface PlaylistProps {
    songs: Song[];
    onSelectSong: (song: Song, index: number) => void;
}

export function Playlist({ songs, onSelectSong }: PlaylistProps) {
    const getDisplayName = (uri: string) => {
        // Extract file name from URI
        const fileName = uri.split('/').pop() || '';
        // Remove file extension and decode URI component
        return decodeURIComponent(fileName.split('.').slice(0, -1).join('.'));
    };

    return (
        <FlatList
            data={songs}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
                <TouchableOpacity onPress={() => onSelectSong(item, index)}>
                    <ThemedView style={styles.songItem}>
                        <View style={styles.songInfo}>
                            <ThemedText style={styles.songTitle}>
                                {item.title || getDisplayName(item.uri)}
                            </ThemedText>
                            <ThemedText style={styles.songArtist}>
                                {item.artist || 'Unknown Artist'}
                            </ThemedText>
                        </View>
                    </ThemedView>
                </TouchableOpacity>
            )}
            style={styles.flatList}
        />
    );
}

const styles = StyleSheet.create({
    flatList: {
        width: '100%',
    },
    songItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    songInfo: {
        flex: 1,
    },
    songTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    songArtist: {
        fontSize: 14,
        color: '#aaa',
    },
});
