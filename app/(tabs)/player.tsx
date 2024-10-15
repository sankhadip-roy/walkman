import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Playlist } from '@/components/Playlist';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import { useSongs } from '@/components/SongsContext';

const { width } = Dimensions.get('window');

type Song = {
    id: string;
    title: string;
    artist: string;
    uri: string;
};

export default function PlayerScreen() {
    const { songs } = useSongs();
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (songs.length > 0 && !currentSong) {
            setCurrentSong(songs[0]);
        }
    }, [songs]);

    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    const loadSongs = async () => {
        try {
            const storedSongs = await AsyncStorage.getItem('songs');
            if (storedSongs) {
                const parsedSongs = JSON.parse(storedSongs);
                setSongs(parsedSongs);
                if (parsedSongs.length > 0) {
                    setCurrentSong(parsedSongs[0]);
                }
            }
        } catch (error) {
            console.error('Error loading songs:', error);
        }
    };

    async function playSound(song = currentSong, index = currentIndex) {
        if (!song || !song.uri) {
            console.log('No song or song URI available');
            return;
        }

        if (sound) {
            await sound.unloadAsync();
        }

        console.log('Loading Sound', song.uri);
        try {
            let uri = song.uri;

            // Check if the URI is a content URI
            if (uri.startsWith('content://')) {
                // Copy the file to app's cache directory
                const fileInfo = await FileSystem.getInfoAsync(uri);
                if (fileInfo.exists) {
                    const fileName = uri.split('/').pop();
                    const destination = `${FileSystem.cacheDirectory}${fileName}`;
                    await FileSystem.copyAsync({
                        from: uri,
                        to: destination
                    });
                    uri = destination;
                }
            }

            const { sound: newSound } = await Audio.Sound.createAsync({ uri });
            setSound(newSound);
            setCurrentSong(song);
            setCurrentIndex(index);

            console.log('Playing Sound');
            await newSound.playAsync();
            setIsPlaying(true);

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded) {
                    setPosition(status.positionMillis);
                    setDuration(status.durationMillis || 0);
                }
            });
        } catch (error) {
            console.error('Error loading or playing sound:', error);
        }
    }

    async function pauseSound() {
        if (sound) {
            await sound.pauseAsync();
            setIsPlaying(false);
        }
    }

    async function seekSound(value: number) {
        if (sound) {
            await sound.setPositionAsync(value);
        }
    }

    function handleSelectSong(song: Song, index: number) {
        playSound(song, index);
    }

    function handlePrevious() {
        const newIndex = (currentIndex - 1 + songs.length) % songs.length;
        playSound(songs[newIndex], newIndex);
    }

    function handleNext() {
        const newIndex = (currentIndex + 1) % songs.length;
        playSound(songs[newIndex], newIndex);
    }

    return (
        <LinearGradient
            colors={['#1e1e1e', '#121212']}
            style={styles.container}
        >
            <View style={styles.contentContainer}>
                <ThemedText style={styles.title}>Now Playing</ThemedText>
                <View style={styles.songInfo}>
                    <ThemedText style={styles.songTitle}>{currentSong?.title || 'No song selected'}</ThemedText>
                    <ThemedText style={styles.artistName}>{currentSong?.artist || ''}</ThemedText>
                </View>
                <View style={styles.controls}>
                    <TouchableOpacity onPress={handlePrevious}>
                        <Ionicons name="play-skip-back" size={32} color="#0a7ea4" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={isPlaying ? pauseSound : () => playSound()}>
                        <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={48}
                            color="#0a7ea4"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleNext}>
                        <Ionicons name="play-skip-forward" size={32} color="#0a7ea4" />
                    </TouchableOpacity>
                </View>
                <View style={styles.sliderContainer}>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={duration}
                        value={position}
                        onSlidingComplete={seekSound}
                        minimumTrackTintColor="#0a7ea4"
                        maximumTrackTintColor="#666666"
                        thumbTintColor="#0a7ea4"
                    />
                    <View style={styles.timeContainer}>
                        <ThemedText style={styles.timeText}>{formatTime(position)}</ThemedText>
                        <ThemedText style={styles.timeText}>{formatTime(duration)}</ThemedText>
                    </View>
                </View>

                <ThemedText style={styles.playlistTitle}>Playlist</ThemedText>
                <Playlist songs={songs} onSelectSong={handleSelectSong} />
            </View>
        </LinearGradient>
    );
}

function formatTime(milliseconds: number) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60, // Add extra padding to the top
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#fff',
    },
    songInfo: {
        alignItems: 'center',
        marginBottom: 40,
    },
    songTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#fff',
    },
    artistName: {
        fontSize: 18,
        color: '#aaa',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        width: '60%',
    },
    sliderContainer: {
        width: '100%',
        marginBottom: 20,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    timeText: {
        color: '#aaa',
        fontSize: 12,
    },
    playlistTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 10,
        alignSelf: 'flex-start',
        color: '#fff',
    },
});
