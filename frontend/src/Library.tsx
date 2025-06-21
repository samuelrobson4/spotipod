import { useNavigate } from 'react-router-dom';
import React from 'react';

interface LibraryProps {
  importedItems: any[];
  handleRemove: (id: string) => void;
  handleRemoveAlbum: (id: string) => void;
  filter: 'all' | 'playlists' | 'albums';
  setFilter: (filter: 'all' | 'playlists' | 'albums') => void;
  urlInput: string;
  setUrlInput: (url: string) => void;
  handleImportByUrl: () => void;
  urlError: string | null;
}

function Library({
  importedItems,
  handleRemove,
  handleRemoveAlbum,
  filter,
  setFilter,
  urlInput,
  setUrlInput,
  handleImportByUrl,
  urlError,
}: LibraryProps) {
  const navigate = useNavigate();

  return (
    <div className="main-content">
      <div className={`library-list ${importedItems.length > 10 ? 'two-columns' : ''}`}>
        <h3>My Library</h3>
        <div className="import-bar">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste Spotify URL to import..."
            style={{ flex: 1, padding: '0.5em', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <button onClick={handleImportByUrl} className="import-btn">
            Import
          </button>
        </div>
        {urlError && <p style={{ color: 'red', margin: 0, marginBottom: 12 }}>{urlError}</p>}
        <div className="filter-buttons">
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
          <button onClick={() => setFilter('playlists')} className={filter === 'playlists' ? 'active' : ''}>Playlists</button>
          <button onClick={() => setFilter('albums')} className={filter === 'albums' ? 'active' : ''}>Albums</button>
        </div>
        {importedItems.length > 0 ? (
          importedItems.map((item) => (
            <div
              key={item.id}
              className="library-list-item"
              onClick={() => navigate(`/item/${item.type}/${item.id}`)}
            >
              <img src={item.images[0]?.url} alt={item.name} />
              <div className="library-title">{item.name}</div>
              <div className="library-type">{item.type}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.type === 'playlist') {
                    handleRemove(item.id);
                  } else {
                    handleRemoveAlbum(item.id);
                  }
                }}
                className={`remove-btn import-btn imported`}
                title="Click to remove from library"
              >
                Added
              </button>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🎶</div>
            Your library is empty.
            <br />
            Paste a Spotify URL to add an album or playlist.
          </div>
        )}
      </div>
    </div>
  );
}

export default Library; 