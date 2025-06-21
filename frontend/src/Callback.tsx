import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlayer } from './PlayerContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function Callback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken } = usePlayer();
  const [message, setMessage] = useState('Processing Spotify Login...');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const redirectUri = window.location.origin + '/callback';
    if (code) {
      fetch(`${API_BASE_URL}/api/spotify/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            localStorage.setItem('spotify_access_token', data.access_token);
            setToken(data.access_token);
            navigate('/');
          } else {
            setMessage('Failed to get access token: ' + (data.error?.error_description || JSON.stringify(data)));
          }
        })
        .catch(err => setMessage('Error: ' + err.message));
    } else {
      setMessage('No authorization code found in URL.');
    }
  }, [location, navigate, setToken]);

  return (
    <div>
      <h2>{message}</h2>
    </div>
  );
}

export default Callback; 