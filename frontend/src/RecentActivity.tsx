import React, { useState, useEffect } from 'react';
import { usePlayer } from './PlayerContext';

interface RecentActivityProps {
  handleImport: (playlist: any) => void;
  handleImportAlbum: (album: any) => void;
  handleRemove: (playlistId: string) => void;
  handleRemoveAlbum: (albumId: string) => void;
  importedPlaylists: any[];
  importedAlbums: any[];
}

function RecentActivity({ 
  handleImport, 
  handleImportAlbum, 
  handleRemove, 
  handleRemoveAlbum, 
  importedPlaylists, 
  importedAlbums 
}: RecentActivityProps) {
  const { token } = usePlayer();
  const [recentPlaylists, setRecentPlaylists] = useState<any[]>([]);
  const [recentAlbums, setRecentAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchRecentActivity = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch recently played tracks
        const recentTracksRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!recentTracksRes.ok) {
          throw new Error(`Failed to fetch recent tracks: ${recentTracksRes.status}`);
        }

        const recentTracks = await recentTracksRes.json();
        
        // Extract unique playlists and albums from recent tracks
        const playlists = new Map();
        const albums = new Map();

        recentTracks.items.forEach((item: any) => {
          const track = item.track;
          
          // Add album
          if (track.album && !albums.has(track.album.id)) {
            albums.set(track.album.id, track.album);
          }
        });

        // Fetch user's playlists
        try {
          const userPlaylistsRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (userPlaylistsRes.ok) {
            const userPlaylists = await userPlaylistsRes.json();
            userPlaylists.items.forEach((playlist: any) => {
              if (!playlists.has(playlist.id)) {
                playlists.set(playlist.id, playlist);
              }
            });
          }
        } catch (playlistError) {
          console.log('Could not fetch user playlists:', playlistError);
        }

        // Fetch featured playlists (Spotify-curated)
        try {
          const featuredRes = await fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=20', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (featuredRes.ok) {
            const featuredPlaylists = await featuredRes.json();
            featuredPlaylists.playlists.items.forEach((playlist: any) => {
              if (!playlists.has(playlist.id)) {
                playlists.set(playlist.id, playlist);
              }
            });
          }
        } catch (featuredError) {
          console.log('Could not fetch featured playlists:', featuredError);
        }

        // Fetch playlists from popular categories
        try {
          const popularCategories = ['pop', 'hip-hop', 'rock', 'mood', 'party', 'workout'];
          
          for (const category of popularCategories) {
            try {
              const categoryRes = await fetch(`https://api.spotify.com/v1/browse/categories/${category}/playlists?limit=10`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              if (categoryRes.ok) {
                const categoryPlaylists = await categoryRes.json();
                categoryPlaylists.playlists.items.forEach((playlist: any) => {
                  if (!playlists.has(playlist.id)) {
                    playlists.set(playlist.id, playlist);
                  }
                });
              }
            } catch (categoryError) {
              console.log(`Could not fetch ${category} playlists:`, categoryError);
            }
          }
        } catch (categoriesError) {
          console.log('Could not fetch category playlists:', categoriesError);
        }

        // Fetch new releases (albums)
        try {
          const newReleasesRes = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=20', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (newReleasesRes.ok) {
            const newReleases = await newReleasesRes.json();
            newReleases.albums.items.forEach((album: any) => {
              if (!albums.has(album.id)) {
                albums.set(album.id, album);
              }
            });
          }
        } catch (newReleasesError) {
          console.log('Could not fetch new releases:', newReleasesError);
        }

        setRecentPlaylists(Array.from(playlists.values()));
        setRecentAlbums(Array.from(albums.values()));
      } catch (err) {
        console.error('Error fetching recent activity:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch recent activity');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, [token]);

  const isPlaylistImported = (playlistId: string) => {
    return importedPlaylists.some(p => p.id === playlistId);
  };

  const isAlbumImported = (albumId: string) => {
    return importedAlbums.some(a => a.id === albumId);
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading">Loading your recent activity...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="recent-section">
        <h3>Recent Albums</h3>
        {recentAlbums.length > 0 ? (
          <div className="recent-grid">
            {recentAlbums.map((album) => (
              <div key={album.id} className="recent-item">
                <img src={album.images[0]?.url} alt={album.name} />
                <div className="recent-item-info">
                  <div className="recent-item-name">{album.name}</div>
                  <div className="recent-item-artist">{album.artists[0]?.name}</div>
                  <div className="recent-item-type">Album</div>
                </div>
                <button
                  onClick={() => isAlbumImported(album.id) ? handleRemoveAlbum(album.id) : handleImportAlbum(album)}
                  className={`import-btn ${isAlbumImported(album.id) ? 'imported' : ''}`}
                  title={isAlbumImported(album.id) ? 'Click to remove from library' : 'Add to library'}
                >
                  {isAlbumImported(album.id) ? 'Added' : 'Add to Library'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No recent albums found.</div>
        )}
      </div>

      <div className="recent-section">
        <h3>Recent Playlists</h3>
        {recentPlaylists.length > 0 ? (
          <div className="recent-grid">
            {recentPlaylists.map((playlist) => (
              <div key={playlist.id} className="recent-item">
                <img src={playlist.images[0]?.url} alt={playlist.name} />
                <div className="recent-item-info">
                  <div className="recent-item-name">{playlist.name}</div>
                  <div className="recent-item-artist">{playlist.owner?.display_name}</div>
                  <div className="recent-item-type">Playlist</div>
                </div>
                <button
                  onClick={() => isPlaylistImported(playlist.id) ? handleRemove(playlist.id) : handleImport(playlist)}
                  className={`import-btn ${isPlaylistImported(playlist.id) ? 'imported' : ''}`}
                  title={isPlaylistImported(playlist.id) ? 'Click to remove from library' : 'Add to library'}
                >
                  {isPlaylistImported(playlist.id) ? 'Added' : 'Add to Library'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No recent playlists found.</div>
        )}
      </div>
    </div>
  );
}

export default RecentActivity; 