import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  AppState,
  Image,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Playlist } from "@/components/Playlist";
import { useSongs } from "@/components/SongsContext";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as DocumentPicker from "expo-document-picker";
import Slider from "@react-native-community/slider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseBuffer } from "music-metadata-browser";
import { Buffer } from "buffer";

global.Buffer = Buffer;

const { width } = Dimensions.get("window");

type Song = {
  id: string;
  title: string;
  artist: string;
  uri: string;
  artwork?: string;
};

export default function PlayerScreen() {
  const { songs } = useSongs();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [songMetadata, setSongMetadata] = useState<any | null>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      // console.log("Media library permission not granted"); //log
    }
  };

  useEffect(() => {
    async function fetchMetadata() {
      if (songs.length > 0 && !currentSong) {
        setCurrentSong(songs[0]);
        const metadata = await getMp3Metadata(songs[0].uri);
        setSongMetadata(metadata);
      }
    }

    fetchMetadata();
  }, [songs]);

  async function getMp3Metadata(uri) {
    try {
      // Read the file as a binary string
      const fileContents = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert the base64 string to a buffer
      const buffer = Buffer.from(fileContents, "base64");

      // Parse metadata
      const metadata = await parseBuffer(buffer, "audio/mpeg");

      return metadata; // format: metadata.common.title, metadata.common.album, metadata.common.artist, metadata.common.picture (this is an array and in binary format);
    } catch (error) {
      console.error("Error reading metadata:", error);
    }
  }

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, [sound, isPlaying]);

  const handleAppStateChange = async (nextAppState: string) => {
    if (nextAppState === "active") {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
        }
      }
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error("Error configuring audio:", error);
      }
    };

    configureAudio();
  }, []);

  const onPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        handleNext();
      }
    }
  };

  async function playSound(song = currentSong, index = currentIndex) {
    if (!song || !song.uri) {
      console.log("No song or song URI available");
      return;
    }

    try {
      // If we already have a sound object and it's the same song
      if (sound && currentSong && currentSong.uri === song.uri) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.playAsync();
          setIsPlaying(true);
          return;
        }
      }

      // If it's a different song or no sound object exists
      if (sound) {
        await sound.unloadAsync();
      }

      // loadAlbumArt(song);
      setSongMetadata(await getMp3Metadata(currentSong.uri));
      print(songMetadata); //log**

      console.log("Loading Sound", song.uri);
      let uri = song.uri;

      if (uri.startsWith("content://")) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists) {
          const fileName = uri.split("/").pop();
          const destination = `${FileSystem.cacheDirectory}${fileName}`;
          await FileSystem.copyAsync({
            from: uri,
            to: destination,
          });
          uri = destination;
        }
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: false },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setCurrentSong(song);
      setCurrentIndex(index);
      setIsPlaying(true);

      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      await newSound.playAsync();
    } catch (error) {
      console.error("Error loading or playing sound:", error);
    }
  }

  async function pauseSound() {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        }
      }
    } catch (error) {
      console.error("Error pausing sound:", error);
    }
  }

  const togglePlayPause = async () => {
    try {
      if (!sound || !currentSong) {
        await playSound();
        return;
      }

      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await pauseSound();
        } else {
          await playSound();
        }
      } else {
        await playSound();
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
    }
  };

  async function seekSound(value: number) {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.setPositionAsync(value);
        }
      }
    } catch (error) {
      console.error("Error seeking sound:", error);
    }
  }

  function handleSelectSong(song: Song, index: number) {
    playSound(song, index);
  }

  async function handlePrevious() {
    const newIndex = (currentIndex - 1 + songs.length) % songs.length;
    await playSound(songs[newIndex], newIndex);
  }

  async function handleNext() {
    const newIndex = (currentIndex + 1) % songs.length;
    await playSound(songs[newIndex], newIndex);
  }

  return (
    <LinearGradient colors={["#1e1e1e", "#121212"]} style={styles.container}>
      <View style={styles.contentContainer}>
        <ThemedText style={styles.title}>Now Playing</ThemedText>

        <View style={styles.artworkContainer}>
          {songMetadata?.common.picture && songMetadata.common.picture[0] ? (
            <Image
              source={{
                uri: `data:${
                  songMetadata.common.picture[0].format
                };base64,${Buffer.from(
                  songMetadata.common.picture[0].data
                ).toString("base64")}`,
              }}
              style={styles.artwork}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderArtwork}>
              <Ionicons name="musical-notes" size={64} color="#666666" />
            </View>
          )}
        </View>

        <View style={styles.songInfo}>
          <ThemedText style={styles.songTitle}>
            {songMetadata?.common.title || "No song selected"}
          </ThemedText>
          <ThemedText style={styles.artistName}>
            {songMetadata?.common.artist || ""}
          </ThemedText>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={handlePrevious}>
            <Ionicons name="play-skip-back" size={32} color="#0a7ea4" />
          </TouchableOpacity>
          <TouchableOpacity onPress={togglePlayPause}>
            <Ionicons
              name={isPlaying ? "pause" : "play"}
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
            <ThemedText style={styles.timeText}>
              {formatTime(position)}
            </ThemedText>
            <ThemedText style={styles.timeText}>
              {formatTime(duration)}
            </ThemedText>
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
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff",
  },
  songInfo: {
    alignItems: "center",
    marginBottom: 40,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#fff",
  },
  artistName: {
    fontSize: 18,
    color: "#aaa",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    width: "60%",
  },
  sliderContainer: {
    width: "100%",
    marginBottom: 20,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  timeText: {
    color: "#aaa",
    fontSize: 12,
  },
  playlistTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
    alignSelf: "flex-start",
    color: "#fff",
  },
  artworkContainer: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 30,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  artwork: {
    width: "100%",
    height: "100%",
  },
  placeholderArtwork: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
  },
});
