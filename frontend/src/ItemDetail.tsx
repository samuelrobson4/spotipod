import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from './PlayerContext';

function ItemDetail() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { playTrack, token, currentTrack } = usePlayer();
  const [item, setItem] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !type || !id) return;
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        let res, data;
        if (type === 'playlist') {
          res = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          data = await res.json();
          setItem(data);
          setTracks(data.tracks.items.map((t: any) => t.track));
        } else if (type === 'album') {
          res = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          data = await res.json();
          setItem(data);
          setTracks(data.tracks.items);
        }
        setLoading(false);
      } catch (e: any) {
        setError('Failed to load item.');
        setLoading(false);
      }
    };
    fetchData();
  }, [type, id, token]);

  return (
    <div style={{ maxWidth: 700, margin: '60px auto 40px', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          title="Back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20,11V13H8L13.5,18.5L12,20L4,12L12,4L13.5,5.5L8,11H20Z" />
          </svg>
        </button>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>
      ) : error ? (
        <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
            {item.images && item.images[0] && (
              <img src={item.images[0].url} alt={item.name} style={{ width: 80, height: 80, borderRadius: 12 }} />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 22 }}>{item.name}</div>
              <div style={{ color: '#888', fontSize: 15 }}>{type === 'playlist' ? 'Playlist' : 'Album'}</div>
            </div>
          </div>
          <div style={{ borderRadius: 16, background: '#f4f4f4', boxShadow: '0 2px 8px #0001', padding: 0, overflow: 'hidden' }}>
            {tracks.map((track, idx) => (
              <div
                key={track.id}
                onClick={() => item?.uri && playTrack(item.uri, track.uri)}
                className={`track-list-item ${currentTrack?.id === track.id ? 'playing-track' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '18px 20px',
                  borderBottom: idx !== tracks.length - 1 ? '1px solid #e0e0e0' : 'none',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 500,
                  transition: 'background 0.15s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#eaeaea')}
                onMouseOut={e => (e.currentTarget.style.background = currentTrack?.id === track.id ? '#eaf6ff' : '#fff')}
              >
                <span style={{ width: '20px', textAlign: 'right', color: '#888', fontSize: 14 }}>{idx + 1}</span>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</span>
                <span style={{ color: '#888', fontSize: 14, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                  {track.artists?.map((a: any) => a.name).join(', ')}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ItemDetail; 