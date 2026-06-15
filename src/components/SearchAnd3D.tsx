import { useState } from 'react'
import '../styles/SearchAnd3D.css'

interface SearchResult {
  id: string
  name: string
  smiles: string
  similarity: number
  source: string
}

interface SearchAnd3DProps {
  onSearch?: (query: string, type: 'substructure' | 'similarity') => void
  results?: SearchResult[]
  loading?: boolean
  onSelect3D?: (smiles: string) => void
}

export function SearchAnd3D({ onSearch, results = [], loading = false, onSelect3D }: SearchAnd3DProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'substructure' | 'similarity'>('substructure')
  const [similarity, setSimilarity] = useState(0.8)
  const [show3D, setShow3D] = useState(false)
  const [selected3D, setSelected3D] = useState<string | null>(null)

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    onSearch?.(searchQuery, searchType)
  }

  const handle3DSelect = (smiles: string) => {
    setSelected3D(smiles)
    onSelect3D?.(smiles)
  }

  return (
    <div className="search-and-3d">
      <div className="search-section">
        <h3>Substructure & Similarity Search</h3>

        <div className="search-controls">
          <div className="search-type">
            <label>
              <input
                type="radio"
                name="searchType"
                value="substructure"
                checked={searchType === 'substructure'}
                onChange={() => setSearchType('substructure')}
              />
              Substructure Search
            </label>
            <label>
              <input
                type="radio"
                name="searchType"
                value="similarity"
                checked={searchType === 'similarity'}
                onChange={() => setSearchType('similarity')}
              />
              Similarity Search
            </label>
          </div>

          {searchType === 'similarity' && (
            <div className="similarity-control">
              <label>Similarity Threshold: {(similarity * 100).toFixed(0)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={similarity}
                onChange={(e) => setSimilarity(parseFloat(e.target.value))}
              />
            </div>
          )}

          <div className="search-input">
            <input
              type="text"
              placeholder="Enter SMILES or draw structure..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
            />
            <button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="search-results">
            <h4>Results ({results.length})</h4>
            <div className="results-list">
              {results.map((result) => (
                <div key={result.id} className="result-item">
                  <div className="result-info">
                    <div className="result-name">{result.name}</div>
                    <div className="result-smiles">{result.smiles}</div>
                    {searchType === 'similarity' && (
                      <div className="result-similarity">
                        Similarity: {(result.similarity * 100).toFixed(1)}%
                      </div>
                    )}
                    <div className="result-source">{result.source}</div>
                  </div>
                  <button
                    className="view-3d-btn"
                    onClick={() => handle3DSelect(result.smiles)}
                    title="View in 3D"
                  >
                    3D
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && results.length === 0 && searchQuery && (
          <div className="no-results">No results found</div>
        )}
      </div>

      <div className="visualization-section">
        <h3>3D Molecular Visualization</h3>

        <div className="visualization-controls">
          <button
            className={`viz-btn ${show3D ? 'active' : ''}`}
            onClick={() => setShow3D(!show3D)}
          >
            {show3D ? 'Hide 3D View' : 'Show 3D View'}
          </button>
        </div>

        {show3D && (
          <div className="visualization-container">
            <div id="3dmol-viewer" className="viewer">
              <div className="viewer-placeholder">
                <p>3D Molecular Viewer</p>
                <p className="info">
                  {selected3D
                    ? 'Loading 3D structure...'
                    : 'Select a structure or draw one to view in 3D'}
                </p>
              </div>
            </div>

            <div className="visualization-options">
              <h4>Display Options</h4>
              <div className="options-grid">
                <label>
                  <input type="radio" name="style" value="stick" defaultChecked />
                  Stick Model
                </label>
                <label>
                  <input type="radio" name="style" value="ball" />
                  Ball & Stick
                </label>
                <label>
                  <input type="radio" name="style" value="sphere" />
                  Space-Filling
                </label>
                <label>
                  <input type="radio" name="style" value="cartoon" />
                  Cartoon (Proteins)
                </label>
              </div>

              <div className="color-options">
                <label>
                  <input type="radio" name="color" value="element" defaultChecked />
                  By Element
                </label>
                <label>
                  <input type="radio" name="color" value="chain" />
                  By Chain
                </label>
                <label>
                  <input type="radio" name="color" value="spectrum" />
                  Spectrum
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="info-section">
        <h4>About Search & 3D</h4>
        <ul>
          <li>
            <strong>Substructure Search:</strong> Find all compounds containing your query structure
          </li>
          <li>
            <strong>Similarity Search:</strong> Find compounds similar to your query (Tanimoto coefficient)
          </li>
          <li>
            <strong>3D Visualization:</strong> View molecular structures in 3D with multiple display modes
          </li>
          <li>
            <strong>Database:</strong> Searches public databases (ChEMBL, PubChem subsets)
          </li>
        </ul>
      </div>
    </div>
  )
}
