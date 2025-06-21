import { useState, useEffect, useRef } from 'react'
import './App.css'
import { Routes, Route, Link } from 'react-router-dom'
import { PlayerProvider, usePlayer } from './PlayerContext'
import Library from './Library'
import ItemDetail from './ItemDetail'
import Callback from './Callback'
import MiniPlayer from './MiniPlayer'
import RecentActivity from './RecentActivity'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// TypeScript declarations for Spotify SDK
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: (() => void) | undefined;
    Spotify: any;
  }
}

function AppContent() {
  const {
    token,
    setToken,
    setPlayer,
    setDeviceId,
    setCurrentTrack,
    setIsPlaying,
    setProgress,
    setDuration,
    setIsShuffle
  } = usePlayer();
  const sdkLoaded = useRef(false);

  // State for the library
  const [importedPlaylists, setImportedPlaylists] = useState<any[]>(() => {
    const saved = localStorage.getItem('imported_playlists');
    return saved ? JSON.parse(saved) : [];
  });
  const [importedAlbums, setImportedAlbums] = useState<any[]>(() => {
    const saved = localStorage.getItem('imported_albums');
    return saved ? JSON.parse(saved) : [];
  });
  const [filter, setFilter] = useState<'all' | 'playlists' | 'albums'>('all');
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // Login
  const handleLogin = () => {
    const redirectUri = window.location.origin + '/callback';
    window.location.href = `${API_BASE_URL}/api/spotify/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  // Load Spotify Web Playback SDK
  useEffect(() => {
    if (!token || sdkLoaded.current) return;
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const _player = new window.Spotify.Player({
        name: 'Web Playback SDK Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(token);
        },
        volume: 0.5,
      });

      setPlayer(_player);

      _player.addListener('ready', ({ device_id }: { device_id: string }) => {
        setDeviceId(device_id);
      });

      _player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
        setProgress(state.position);
        setDuration(state.duration);
        setIsShuffle(state.shuffle);
      });

      _player.connect();
    };
    sdkLoaded.current = true;
  }, [token, setPlayer, setDeviceId, setCurrentTrack, setIsPlaying, setProgress, setDuration, setIsShuffle]);

  // Library management
  const handleImport = (playlist: any) => {
    if (!importedPlaylists.find((p: any) => p.id === playlist.id)) {
      setImportedPlaylists([...importedPlaylists, playlist]);
    }
  };

  const handleRemove = (playlistId: string) => {
    setImportedPlaylists(importedPlaylists.filter((p: any) => p.id !== playlistId));
  };

  const handleImportAlbum = (album: any) => {
    if (!importedAlbums.find((a: any) => a.id === album.id)) {
      setImportedAlbums([...importedAlbums, album]);
    }
  };

  const handleRemoveAlbum = (albumId: string) => {
    setImportedAlbums(importedAlbums.filter((a: any) => a.id !== albumId));
  };

  useEffect(() => {
    localStorage.setItem('imported_playlists', JSON.stringify(importedPlaylists));
  }, [importedPlaylists]);

  useEffect(() => {
    localStorage.setItem('imported_albums', JSON.stringify(importedAlbums));
  }, [importedAlbums]);

  const handleImportByUrl = async () => {
    setUrlError(null);
    
    console.log('Attempting to parse URL:', urlInput);
    
    // More comprehensive URL parsing for different Spotify URL formats
    const playlistMatch = urlInput.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
    const albumMatch = urlInput.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/);
    const userPlaylistMatch = urlInput.match(/spotify\.com\/user\/[^\/]+\/playlist\/([a-zA-Z0-9]+)/);
    const openSpotifyMatch = urlInput.match(/open\.spotify\.com\/(playlist|album)\/([a-zA-Z0-9]+)/);
    
    console.log('Regex matches:', {
      playlistMatch: playlistMatch?.[1],
      albumMatch: albumMatch?.[1],
      userPlaylistMatch: userPlaylistMatch?.[1],
      openSpotifyMatch: openSpotifyMatch?.[2]
    });
    
    let id, type;
    
    if (playlistMatch) {
      id = playlistMatch[1];
      type = 'playlist';
    } else if (albumMatch) {
      id = albumMatch[1];
      type = 'album';
    } else if (userPlaylistMatch) {
      id = userPlaylistMatch[1];
      type = 'playlist';
    } else if (openSpotifyMatch) {
      id = openSpotifyMatch[2];
      type = openSpotifyMatch[1];
    }

    console.log('Extracted ID and type:', { id, type });

    if (!id || !token) {
      setUrlError('Invalid URL or not logged in.');
      return;
    }

    console.log(`Attempting to import ${type} with ID: ${id}`);

    try {
      let data;
      if (type === 'playlist') {
        // First try the direct playlist endpoint
        let res = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!res.ok) {
          console.log('Direct playlist fetch failed, trying user playlists endpoint...');
          
          // Test API access first
          console.log('Testing API access...');
          try {
            const testRes = await fetch('https://api.spotify.com/v1/me', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (testRes.ok) {
              const userData = await testRes.json();
              console.log('API access confirmed for user:', userData.display_name);
            } else {
              console.error('API access test failed:', testRes.status);
            }
          } catch (testError) {
            console.error('API access test error:', testError);
          }
          
          // If direct access fails, try to find it in user's playlists
          const userPlaylistsRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (userPlaylistsRes.ok) {
            const userPlaylists = await userPlaylistsRes.json();
            const foundPlaylist = userPlaylists.items.find((playlist: any) => playlist.id === id);
            
            if (foundPlaylist) {
              console.log('Found playlist in user playlists:', foundPlaylist.name);
              handleImport(foundPlaylist);
              setUrlInput('');
              return;
            }
          }
          
          // Try search endpoint as a fallback
          console.log('Trying search endpoint...');
          try {
            const searchRes = await fetch(`https://api.spotify.com/v1/search?q=playlist:37i9dQZF1DX4OzrY981I1W&type=playlist`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (searchRes.ok) {
              const searchResults = await searchRes.json();
              console.log('Search results:', searchResults);
              
              if (searchResults.playlists && searchResults.playlists.items.length > 0) {
                const foundPlaylist = searchResults.playlists.items.find((playlist: any) => playlist.id === id);
                
                if (foundPlaylist) {
                  console.log('Found playlist via search:', foundPlaylist.name);
                  handleImport(foundPlaylist);
                  setUrlInput('');
                  return;
                }
              }
            }
          } catch (searchError) {
            console.log('Search fetch failed:', searchError);
          }
          
          // Try one more approach - check if it's a featured playlist
          console.log('Trying featured playlists endpoint...');
          try {
            const featuredRes = await fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=50', {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (featuredRes.ok) {
              const featuredPlaylists = await featuredRes.json();
              const foundPlaylist = featuredPlaylists.playlists.items.find((playlist: any) => playlist.id === id);
              
              if (foundPlaylist) {
                console.log('Found playlist in featured playlists:', foundPlaylist.name);
                handleImport(foundPlaylist);
                setUrlInput('');
                return;
              }
            }
          } catch (featuredError) {
            console.log('Featured playlists fetch failed:', featuredError);
          }
          
          // Try categories approach for Spotify-curated playlists
          console.log('Trying categories endpoint...');
          try {
            const categoriesRes = await fetch('https://api.spotify.com/v1/browse/categories', {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (categoriesRes.ok) {
              const categories = await categoriesRes.json();
              console.log('Available categories:', categories.categories.items.map((cat: any) => cat.name));
              
              // Try a few popular categories that might contain the playlist
              const popularCategories = ['pop', 'hip-hop', 'rock', 'mood', 'party'];
              
              for (const category of popularCategories) {
                try {
                  const categoryPlaylistsRes = await fetch(`https://api.spotify.com/v1/browse/categories/${category}/playlists?limit=50`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  
                  if (categoryPlaylistsRes.ok) {
                    const categoryPlaylists = await categoryPlaylistsRes.json();
                    const foundPlaylist = categoryPlaylists.playlists.items.find((playlist: any) => playlist.id === id);
                    
                    if (foundPlaylist) {
                      console.log(`Found playlist in ${category} category:`, foundPlaylist.name);
                      handleImport(foundPlaylist);
                      setUrlInput('');
                      return;
                    }
                  }
                } catch (categoryError) {
                  console.log(`Category ${category} fetch failed:`, categoryError);
                }
              }
            }
          } catch (categoriesError) {
            console.log('Categories fetch failed:', categoriesError);
          }
          
          const errorData = await res.json().catch(() => ({}));
          console.error('Playlist fetch error:', {
            status: res.status,
            statusText: res.statusText,
            errorData
          });
          
          if (res.status === 404) {
            setUrlError('Playlist not found. This appears to be a Spotify-curated playlist with restricted access. Try importing a different playlist or album.');
          } else if (res.status === 403) {
            setUrlError('Access denied. The playlist might be private or require different permissions.');
          } else {
            setUrlError(`Failed to access playlist: ${res.status} ${res.statusText}`);
          }
          return;
        }
        
        data = await res.json();
        console.log('Successfully fetched playlist:', data.name);
        handleImport(data);
      } else if (type === 'album') {
        const res = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error('Album fetch error:', {
            status: res.status,
            statusText: res.statusText,
            errorData
          });
          
          if (res.status === 404) {
            setUrlError('Album not found.');
          } else {
            setUrlError(`Failed to access album: ${res.status} ${res.statusText}`);
          }
          return;
        }
        
        data = await res.json();
        console.log('Successfully fetched album:', data.name);
        handleImportAlbum(data);
      }
      setUrlInput('');
    } catch (e) {
      console.error('Import error:', e);
      setUrlError(`Failed to import from URL: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const importedItems = [
    ...(filter === 'all' || filter === 'playlists' ? importedPlaylists.map((p: any) => ({ ...p, type: 'playlist' })) : []),
    ...(filter === 'all' || filter === 'albums' ? importedAlbums.map((a: any) => ({ ...a, type: 'album' })) : []),
  ];

  if (!token) {
    return (
      <div className="landing-page">
        <div className="landing-header">
          <h1 className="landing-title">SpotiPod</h1>
          <p className="landing-subtitle">Your personal Spotify library, reimagined</p>
          <button onClick={handleLogin} className="login-btn">
            <span className="login-icon">🎵</span>
            Login with Spotify
          </button>
        </div>
        
        <div className="landing-content">
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🎵</div>
              <h3>Import Your Music</h3>
              <p>Add your favorite Spotify playlists and albums to your personal SpotiPod library with just a URL or browse recent activity.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎧</div>
              <h3>Full Playback Control</h3>
              <p>Play, pause, skip, and control volume with our sleek mini-player that stays with you as you browse.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Retro iPod Vibes</h3>
              <p>Enjoy a nostalgic, clean interface inspired by classic iPod design with modern functionality.</p>
            </div>
          </div>
          
          <div className="cta-section">
            <h2>Ready to rediscover your music?</h2>
            <p>Connect your Spotify account and start building your perfect music library today.</p>
            <button onClick={handleLogin} className="login-btn">
              <span className="login-icon">🎵</span>
              Login with Spotify
            </button>
            <p className="login-note">Free • No data collection • Your music, your way</p>
            <p className="login-note" style={{ marginTop: '12px', color: '#aaa' }}>
              API Target: {API_BASE_URL}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div>
      <div className="header">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1 className="header-title">SpotiPod</h1>
        </Link>
        <div className="header-nav">
          <Link to="/" className={`nav-tab ${window.location.pathname === '/' ? 'active' : ''}`}>
            Library
          </Link>
          <Link to="/recent" className={`nav-tab ${window.location.pathname === '/recent' ? 'active' : ''}`}>
            Spotify Library
          </Link>
          <button onClick={() => {
              localStorage.removeItem('spotify_access_token');
              setToken(null);
          }} className="header-logout">Logout</button>
        </div>
      </div>
      
      <main>
        <Routes>
          <Route path="/" element={
            <Library
              importedItems={importedItems}
              handleRemove={handleRemove}
              handleRemoveAlbum={handleRemoveAlbum}
              filter={filter}
              setFilter={setFilter}
              urlInput={urlInput}
              setUrlInput={setUrlInput}
              handleImportByUrl={handleImportByUrl}
              urlError={urlError}
            />
          } />
          <Route path="/recent" element={
            <RecentActivity
              handleImport={handleImport}
              handleImportAlbum={handleImportAlbum}
              handleRemove={handleRemove}
              handleRemoveAlbum={handleRemoveAlbum}
              importedPlaylists={importedPlaylists}
              importedAlbums={importedAlbums}
            />
          } />
          <Route path="/item/:type/:id" element={<ItemDetail />} />
        </Routes>
      </main>
      <MiniPlayer />
      </div>
  );
}

function App() {
  return (
    <PlayerProvider>
      <Routes>
        <Route path="/*" element={<AppContent />} />
        <Route path="/callback" element={<Callback />} />
      </Routes>
    </PlayerProvider>
  );
}

export default App
