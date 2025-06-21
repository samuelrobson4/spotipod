import { createContext, useContext, useState, type ReactNode, useRef, useEffect } from 'react';

type PlayerContextType = {
  token: string | null;
  setToken: (token: string | null) => void;
  player: any;
  setPlayer: (player: any) => void;
  deviceId: string | null;
  setDeviceId: (deviceId: string | null) => void;
  playTrack: (contextUri: string, trackUri: string) => Promise<void>;
  currentTrack: any;
  setCurrentTrack: (track: any) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  progress: number;
  setProgress: (progress: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  togglePlay: () => void;
  handleSkip: (direction: 'next' | 'prev') => void;
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isShuffle: boolean;
  setIsShuffle: (isShuffle: boolean) => void;
  toggleShuffle: () => void;
  toggleMute: () => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('spotify_access_token'));
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isShuffle, setIsShuffle] = useState(false);
  const volumeRef = useRef(0.5);

  const playTrack = async (contextUri: string, trackUri: string) => {
    if (!deviceId || !token) return;
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context_uri: contextUri,
        offset: {
          uri: trackUri,
        },
      }),
    });
  };

  const toggleShuffle = async () => {
    if (!player || !token) return;
    const newShuffleState = !isShuffle;
    await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${newShuffleState}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setIsShuffle(newShuffleState);
  };

  const toggleMute = () => {
    if (volume > 0) {
      volumeRef.current = volume;
      setVolume(0);
      player?.setVolume(0);
    } else {
      setVolume(volumeRef.current);
      player?.setVolume(volumeRef.current);
    }
  };

  const togglePlay = () => player?.togglePlay();

  const handleSkip = (direction: 'next' | 'prev') => {
    if (!player) return;
    if (direction === 'next') {
      player.nextTrack();
    } else {
      player.previousTrack();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    player?.seek(newProgress);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    volumeRef.current = newVolume;
    setVolume(newVolume);
    player?.setVolume(newVolume);
  }

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress((prevProgress) => prevProgress + 1000);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const value = {
    token,
    setToken,
    player,
    setPlayer,
    deviceId,
    setDeviceId,
    playTrack,
    currentTrack,
    setCurrentTrack,
    isPlaying,
    setIsPlaying,
    progress,
    setProgress,
    duration,
    setDuration,
    volume,
    setVolume,
    togglePlay,
    handleSkip,
    handleSeek,
    handleVolumeChange,
    isShuffle,
    setIsShuffle,
    toggleShuffle,
    toggleMute,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
} 