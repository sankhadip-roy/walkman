import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Song {
    id: string;
    title: string;
    artist: string;
    uri: string;
}

interface SongsContextType {
    songs: Song[];
    setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
    loadSongs: () => Promise<void>;
}

const SongsContext = createContext<SongsContextType | undefined>(undefined);

export const SongsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [songs, setSongs] = useState<Song[]>([]);

    const loadSongs = async () => {
        try {
            const storedSongs = await AsyncStorage.getItem('songs');
            if (storedSongs) {
                setSongs(JSON.parse(storedSongs));
            }
        } catch (error) {
            console.error('Error loading songs:', error);
        }
    };

    useEffect(() => {
        loadSongs();
    }, []);

    return (
        <SongsContext.Provider value={{ songs, setSongs, loadSongs }}>
            {children}
        </SongsContext.Provider>
    );
};

export const useSongs = () => {
    const context = useContext(SongsContext);
    if (context === undefined) {
        throw new Error('useSongs must be used within a SongsProvider');
    }
    return context;
};