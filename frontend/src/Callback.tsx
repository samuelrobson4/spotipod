import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlayer } from './PlayerContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://spotipod-backend.onrender.com';

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
      const requestUrl = `${API_BASE_URL}/api/spotify/token`;
      
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          code: code,
          redirect_uri: redirectUri
        }).toString(),
        mode: 'cors' as RequestMode
      };
      
      fetch(requestUrl, fetchOptions)
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
        .catch(err => {
          console.error('Fetch error:', err);
          setMessage('Error: ' + err.message);
        });
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