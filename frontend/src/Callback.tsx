import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlayer } from './PlayerContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

console.log('Environment check:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  API_BASE_URL,
  NODE_ENV: import.meta.env.NODE_ENV
});

function Callback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken } = usePlayer();
  const [message, setMessage] = useState('Processing Spotify Login...');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const redirectUri = window.location.origin + '/callback';
    
    console.log('Debug info:', {
      API_BASE_URL,
      code: code ? 'present' : 'missing',
      redirectUri,
      fullUrl: window.location.href,
      searchParams: location.search
    });
    
    if (code) {
      const requestBody = { code, redirectUri };
      const requestUrl = `${API_BASE_URL}/api/spotify/token`;
      
      console.log('Sending request to backend:', {
        url: requestUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      });
      
      fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
        .then(res => {
          console.log('Response received:', {
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries())
          });
          return res.json();
        })
        .then(data => {
          console.log('Response data:', data);
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