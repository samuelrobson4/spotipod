import React from 'react';
import { usePlayer } from './PlayerContext';
import './MiniPlayer.css';

function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    togglePlay,
    handleSkip,
    handleSeek,
    handleVolumeChange,
    isShuffle,
    toggleShuffle,
    toggleMute,
  } = usePlayer();

  if (!currentTrack) {
    return null;
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${(Number(seconds) < 10 ? '0' : '')}${seconds}`;
  };

  return (
    <div className="mini-player">
      <div className="track-info">
        <img src={currentTrack.album.images[0].url} alt={currentTrack.name} />
        <div>
          <div className="track-name">{currentTrack.name}</div>
          <div className="artist-name">{currentTrack.artists.map((a: any) => a.name).join(', ')}</div>
        </div>
      </div>

      <div className="player-center">
        <div className="controls">
          <button onClick={toggleShuffle} className={`control-btn ${isShuffle ? 'active' : ''}`} title="Shuffle">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
          </button>
          <button onClick={() => handleSkip('prev')} className="control-btn" title="Previous">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button onClick={togglePlay} className="control-btn play-pause-btn" title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? (
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button onClick={() => handleSkip('next')} className="control-btn" title="Next">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>
        <div className="progress-bar">
          <span className="progress-time">{formatTime(progress)}</span>
          <input type="range" min="0" max={duration} value={progress} onChange={handleSeek} />
          <span className="progress-time">{formatTime(duration)}</span>
        </div>
      </div>
      
      <div className="volume-control">
        <button onClick={toggleMute} className="control-btn" title="Mute/Unmute">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
        </button>
        <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} />
      </div>
    </div>
  );
}

export default MiniPlayer; 