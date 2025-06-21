const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
fs.mkdir(dataDir, { recursive: true }).catch(console.error);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL, // for deployed frontend
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/spotify/login', (req, res) => {
  const { redirect_uri } = req.query;
  const scopes = 'user-read-private playlist-read-private playlist-read-collaborative user-library-read streaming user-modify-playback-state user-read-playback-state user-read-recently-played';
  const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: redirect_uri,
  })}`;
  res.redirect(authUrl);
});

app.post('/api/spotify/token', async (req, res) => {
  const { code, redirect_uri } = req.body;
  
  if (!code || !redirect_uri) {
    return res.status(400).json({ error: 'Missing code or redirect_uri' });
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirect_uri);

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.get('/api/spotify/playlists', async (req, res) => {
  const accessToken = req.headers['authorization'];
  if (!accessToken) {
    return res.status(401).json({ error: 'Missing access token' });
  }
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.get('/api/spotify/albums', async (req, res) => {
  const accessToken = req.headers['authorization'];
  if (!accessToken) {
    return res.status(401).json({ error: 'Missing access token' });
  }
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/albums', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.get('/api/spotify/recently-played', async (req, res) => {
  const accessToken = req.headers['authorization'];
  if (!accessToken) {
    return res.status(401).json({ error: 'Missing access token' });
  }
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=20', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.post('/api/user/library', async (req, res) => {
  const { userId, playlists, albums } = req.body;
  const accessToken = req.headers['authorization'];
  
  if (!accessToken || !userId) {
    return res.status(400).json({ error: 'Missing access token or user ID' });
  }

  try {
    // Verify the user ID by making a request to Spotify API
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    
    if (userResponse.data.id !== userId) {
      return res.status(403).json({ error: 'User ID mismatch' });
    }

    const userData = {
      userId,
      playlists: playlists || [],
      albums: albums || [],
      lastUpdated: new Date().toISOString()
    };

    const filePath = path.join(dataDir, `${userId}.json`);
    await fs.writeFile(filePath, JSON.stringify(userData, null, 2));
    
    res.json({ success: true, message: 'Library saved successfully' });
  } catch (error) {
    console.error('Error saving library:', error);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.get('/api/user/library/:userId', async (req, res) => {
  const { userId } = req.params;
  const accessToken = req.headers['authorization'];
  
  if (!accessToken || !userId) {
    return res.status(400).json({ error: 'Missing access token or user ID' });
  }

  try {
    // Verify the user ID by making a request to Spotify API
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    
    if (userResponse.data.id !== userId) {
      return res.status(403).json({ error: 'User ID mismatch' });
    }

    const filePath = path.join(dataDir, `${userId}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const userData = JSON.parse(data);
      res.json(userData);
    } catch (fileError) {
      // If file doesn't exist, return empty library
      res.json({
        userId,
        playlists: [],
        albums: [],
        lastUpdated: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error loading library:', error);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
}); 