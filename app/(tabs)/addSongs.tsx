import React from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useSongs } from "@/components/SongsContext";

export default function AddSongs() {
  const { songs, setSongs, loadSongs } = useSongs();
  const navigation = useNavigation();

  React.useEffect(() => {
    loadSongs();
  }, []);

  const handleAddSong = async () => {
    try {
      // console.log("Starting song selection..."); //log
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: false,
      });
      // console.log("Document picker result:", result); //log

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // console.log("##asset:", asset); //log
        const fileName = asset.name.split(".").slice(0, -1).join(".");
        const newSong = {
          id: Date.now().toString(),
          title: fileName,
          artist: "can't add now",
          uri: asset.uri,
        };

        // console.log("New song object:", newSong); //log

        const updatedSongs = [...songs, newSong];
        // console.log("Updated songs array:", updatedSongs); //log
        setSongs(updatedSongs);
        await AsyncStorage.setItem("songs", JSON.stringify(updatedSongs));
        // console.log("Songs saved to AsyncStorage"); //log
        Alert.alert("Success", `Added song: ${fileName}`);
      } else {
        // console.log("User cancelled the picker or no asset was selected"); //log
      }
    } catch (error) {
      // console.error("Error adding song:", error); //log
      Alert.alert("Error", "Failed to add song");
    }
  };

  const handleAddFolder = async () => {
    try {
      // console.log("Starting folder selection..."); //log
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: false,
      });
      // console.log("Document picker result:", result); //log

      if (result.assets && result.assets.length > 0) {
        const folderUri = result.assets[0].uri;
        // console.log("Selected folder URI:", folderUri); //log

        const folderInfo =
          await FileSystem.StorageAccessFramework.readDirectoryAsync(folderUri);
        // console.log("Folder contents:", folderInfo); //log

        const audioFiles = folderInfo.filter(
          (file) =>
            file.endsWith(".mp3") ||
            file.endsWith(".wav") ||
            file.endsWith(".m4a")
        );
        // console.log("Filtered audio files:", audioFiles); //log

        const newSongs = audioFiles.map((file, index) => {
          const fileName = file
            .split("/")
            .pop()
            .split(".")
            .slice(0, -1)
            .join(".");
          return {
            id: (Date.now() + index).toString(),
            title: fileName,
            artist: "can't add now",
            uri: `${folderUri}/${file}`,
          };
        });

        // console.log("New songs array:", newSongs); //log

        const updatedSongs = [...songs, ...newSongs];
        // console.log("Updated songs array:", updatedSongs); //log
        setSongs(updatedSongs);
        await AsyncStorage.setItem("songs", JSON.stringify(updatedSongs));
        // console.log("Songs saved to AsyncStorage"); //log
        Alert.alert("Success", `Added ${newSongs.length} songs from folder`);
      } else {
        // console.log("User cancelled the picker or no folder was selected"); //log
      }
    } catch (error) {
      // console.error("Error adding folder:", error); //log
      Alert.alert("Error", "Failed to add folder");
    }
  };

  const handleGoToPlayer = () => {
    navigation.navigate("player");
  };

  const handleRemoveAllSongs = async () => {
    Alert.alert(
      "Remove All Songs",
      "Are you sure you want to remove all songs?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("songs");
              setSongs([]);
              Alert.alert("Success", "All songs have been removed");
            } catch (error) {
              // console.error("Error removing songs:", error); //log
              Alert.alert("Error", "Failed to remove songs");
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Add Songs</ThemedText>
      <TouchableOpacity style={styles.addButton} onPress={handleAddSong}>
        <ThemedText style={styles.addButtonText}>Add Song</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addButton} onPress={handleAddFolder}>
        <ThemedText style={styles.addButtonText}>Add Folder</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={handleRemoveAllSongs}
      >
        <ThemedText style={styles.removeButtonText}>
          Remove All Songs
        </ThemedText>
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
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: "#0a7ea4",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  addButtonText: {
    color: "white",
    textAlign: "center",
  },
  songItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  playerButton: {
    backgroundColor: "#0a7ea4",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  playerButtonText: {
    color: "white",
    textAlign: "center",
  },
  removeButton: {
    backgroundColor: "#d9534f",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  removeButtonText: {
    color: "white",
    textAlign: "center",
  },
});
