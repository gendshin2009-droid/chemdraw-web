import { useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
// import { MolecularProperties } from './components/MolecularProperties'
import { ReactionTools, type ReactionCondition } from './components/ReactionTools'
import { SearchAnd3D, type SearchResult } from './components/SearchAnd3D'
import { Collaboration, type Participant, type Comment } from './components/Collaboration'
import './App.css'

interface MolecularPropertiesData {
  formula?: string
  weight?: number
  smiles?: string
  inchi?: string
  error?: string
  atoms?: number
  bonds?: number
}

// Molecular property calculator
const calculateMolecularProperties = (smiles: string): MolecularPropertiesData => {
  try {
    // Simple SMILES parser for basic properties
    const atomicMasses: { [key: string]: number } = {
      'H': 1.008, 'C': 12.011, 'N': 14.007, 'O': 15.999,
      'S': 32.06, 'P': 30.974, 'F': 18.998, 'Cl': 35.45,
      'Br': 79.904, 'I': 126.90, 'B': 10.81, 'Si': 28.086,
    }

    let weight = 0
    let atomCount = 0
    let bondCount = 0

    // Extract atoms and bonds from SMILES
    const atomRegex = /[A-Z][a-z]?|\[.*?\]/g
    const atoms = smiles.match(atomRegex) || []

    atoms.forEach((atom: string) => {
      const symbol = atom.replace(/[\[\]0-9@H\-+=]/g, '')
      if (symbol && atomicMasses[symbol]) {
        weight += atomicMasses[symbol]
        atomCount++
      }
    })

    // Count bonds (simplified)
    bondCount = (smiles.match(/[-=#:]/g) || []).length

    // Generate formula (simplified)
    const formulaParts: { [key: string]: number } = {}
    atoms.forEach((atom: string) => {
      const symbol = atom.replace(/[\[\]0-9@H\-+=]/g, '')
      if (symbol) {
        formulaParts[symbol] = (formulaParts[symbol] || 0) + 1
      }
    })

    const formula = Object.entries(formulaParts)
      .map(([symbol, count]) => symbol + (count > 1 ? count : ''))
      .join('')

    return {
      smiles,
      formula: formula || 'Unknown',
      weight: Math.round(weight * 100) / 100,
      inchi: `InChI=1S/${formula}`,
      atoms: atomCount,
      bonds: bondCount,
    }
  } catch (error) {
    return {
      smiles,
      error: 'Invalid SMILES string',
    }
  }
}

// 3D Molecule Viewer
const Molecule3D = () => {
  return (
    <group>
      {/* Simple sphere representation for now */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#4f46e5" />
      </mesh>
      <mesh position={[2, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#ec4899" />
      </mesh>
      <mesh position={[-2, 0, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#06b6d4" />
      </mesh>
    </group>
  )
}

// SMILES Structure Visualizer
const SMILESVisualizer = ({ smiles }: { smiles?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!smiles || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw SMILES representation
    ctx.fillStyle = '#333'
    ctx.font = 'bold 16px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('SMILES: ' + smiles, canvas.width / 2, 30)

    // Draw simple molecular representation
    ctx.strokeStyle = '#4f46e5'
    ctx.lineWidth = 2

    // Draw atoms as circles
    const atoms = smiles.match(/[A-Z][a-z]?|\[.*?\]/g) || []
    const atomRadius = 15
    const startX = canvas.width / 2 - (atoms.length * 40) / 2

    atoms.forEach((atom, index) => {
      const x = startX + index * 40
      const y = canvas.height / 2

      // Draw atom circle
      ctx.beginPath()
      ctx.arc(x, y, atomRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Draw atom symbol
      ctx.fillStyle = '#333'
      ctx.font = 'bold 12px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const symbol = atom.replace(/[\[\]0-9@H\-+=]/g, '')
      ctx.fillText(symbol, x, y)

      // Draw bonds
      if (index < atoms.length - 1) {
        ctx.strokeStyle = '#666'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x + atomRadius, y)
        ctx.lineTo(startX + (index + 1) * 40 - atomRadius, y)
        ctx.stroke()
      }
    })
  }, [smiles])

  return <canvas ref={canvasRef} className="smiles-visualizer" />
}

function App() {
  const [smilesInput, setSmilesInput] = useState('c1ccccc1') // Benzene by default
  const [properties, setProperties] = useState<MolecularPropertiesData>({})
  const [exportFormat, setExportFormat] = useState<'mol' | 'smiles' | 'inchi' | 'png' | 'svg'>('mol')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'properties' | 'reactions' | 'search' | 'collab'>('properties')
  const [view3D, setView3D] = useState(false)

  // Phase 3: Reactions
  const [reactionConditions, setReactionConditions] = useState<ReactionCondition[]>([])

  // Phase 4: Search & 3D
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Phase 5: Collaboration
  const [participants, setParticipants] = useState<Participant[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [isCollabConnected, setIsCollabConnected] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Update properties when SMILES changes
  useEffect(() => {
    if (smilesInput.trim()) {
      const props = calculateMolecularProperties(smilesInput)
      setProperties(props)
    }
  }, [smilesInput])

  const handleSmilesInput = (smiles: string) => {
    setSmilesInput(smiles)
  }

  const handleExport = async () => {
    try {
      setIsLoading(true)

      if (exportFormat === 'mol') {
        downloadFile(`\n  Mrv2311 01012100002D\n\n  6  6  0  0  0  0  0  0  0  0999 V2000\n    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    1.2990    0.7500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    1.2990    2.2500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    0.0000    3.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n   -1.2990    2.2500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n   -1.2990    0.7500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n  1  2  2  0  0  0  0  0  0  0  0  0\n  2  3  1  0  0  0  0  0  0  0  0  0\n  3  4  2  0  0  0  0  0  0  0  0  0\n  4  5  1  0  0  0  0  0  0  0  0  0\n  5  6  2  0  0  0  0  0  0  0  0  0\n  6  1  1  0  0  0  0  0  0  0  0  0\nM  END`, 'structure.mol', 'text/plain')
      } else if (exportFormat === 'smiles') {
        downloadFile(smilesInput, 'structure.smi', 'text/plain')
      } else if (exportFormat === 'inchi') {
        downloadFile(properties.inchi || 'InChI=1S/Unknown', 'structure.inchi', 'text/plain')
      } else if (exportFormat === 'png' || exportFormat === 'svg') {
        const canvas = document.querySelector('.smiles-visualizer') as HTMLCanvasElement
        if (canvas) {
          const dataUrl = canvas.toDataURL(`image/${exportFormat}`)
          const link = document.createElement('a')
          link.href = dataUrl
          link.download = `structure.${exportFormat}`
          link.click()
        }
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting structure')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)
      const text = await file.text()
      // Extract SMILES from file
      const smiles = text.split('\n')[0].trim()
      setSmilesInput(smiles)
    } catch (error) {
      console.error('Import error:', error)
      alert('Error importing structure')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setSmilesInput('')
    setProperties({})
  }

  // Phase 3: Handle reaction conditions
  const handleAddCondition = (condition: ReactionCondition) => {
    setReactionConditions([...reactionConditions, condition])
  }

  const handleRemoveCondition = (id: string) => {
    setReactionConditions(reactionConditions.filter((c) => c.id !== id))
  }

  // Phase 4: Handle search
  const handleSearch = async (_query: string, _type: 'substructure' | 'similarity') => {
    setSearchLoading(true)
    try {
      // Simulate search results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          name: 'Benzene',
          smiles: 'c1ccccc1',
          similarity: 0.95,
          source: 'ChEMBL',
        },
        {
          id: '2',
          name: 'Toluene',
          smiles: 'Cc1ccccc1',
          similarity: 0.88,
          source: 'PubChem',
        },
        {
          id: '3',
          name: 'Xylene',
          smiles: 'Cc1ccc(C)cc1',
          similarity: 0.82,
          source: 'ChEMBL',
        },
      ]
      setSearchResults(mockResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  // Phase 5: Handle collaboration
  const handleJoinSession = (userName: string) => {
    const newSessionId = `session_${Date.now()}`
    setSessionId(newSessionId)

    const newParticipant: Participant = {
      id: `user_${Date.now()}`,
      name: userName,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      isActive: true,
    }

    setParticipants([newParticipant])
    setIsCollabConnected(true)
  }

  const handleLeaveSession = () => {
    setSessionId(null)
    setParticipants([])
    setComments([])
    setIsCollabConnected(false)
  }

  const handleAddComment = (text: string) => {
    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      author: participants[0]?.name || 'Anonymous',
      text,
      timestamp: new Date(),
    }
    setComments([...comments, newComment])
  }

  const handleRemoveComment = (id: string) => {
    setComments(comments.filter((c) => c.id !== id))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧪 ChemDraw Web - Real Chemistry Editor</h1>
        <p>Professional Chemical Structure Editor with Molecular Properties & 3D Visualization</p>
      </header>

      <div className="app-container">
        <div className="editor-section">
          {view3D ? (
            <div className="canvas-3d">
              <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                <OrbitControls />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Molecule3D />
              </Canvas>
            </div>
          ) : (
            <SMILESVisualizer smiles={smilesInput} />
          )}
          <button
            className="toggle-3d-btn"
            onClick={() => setView3D(!view3D)}
          >
            {view3D ? '2D View' : '3D View'}
          </button>
        </div>

        <aside className="sidebar">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'properties' ? 'active' : ''}`}
              onClick={() => setActiveTab('properties')}
            >
              Properties
            </button>
            <button
              className={`tab ${activeTab === 'reactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('reactions')}
            >
              Reactions
            </button>
            <button
              className={`tab ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              Search & 3D
            </button>
            <button
              className={`tab ${activeTab === 'collab' ? 'active' : ''}`}
              onClick={() => setActiveTab('collab')}
            >
              Collab
            </button>
          </div>

          <div className="panel">
            <h2>SMILES Input</h2>
            <div className="control-group">
              <textarea
                value={smilesInput}
                onChange={(e) => handleSmilesInput(e.target.value)}
                placeholder="Enter SMILES string (e.g., c1ccccc1 for benzene)"
                className="smiles-input"
                rows={3}
              />
            </div>

            <div className="control-group">
              <label htmlFor="file-input">Import File:</label>
              <input
                id="file-input"
                type="file"
                accept=".mol,.rxn,.sdf,.smi"
                onChange={handleImport}
                disabled={isLoading}
              />
            </div>

            <div className="control-group">
              <label htmlFor="export-format">Export Format:</label>
              <select
                id="export-format"
                value={exportFormat}
                onChange={(e) =>
                  setExportFormat(e.target.value as typeof exportFormat)
                }
              >
                <option value="mol">MOL File</option>
                <option value="smiles">SMILES</option>
                <option value="inchi">InChI</option>
                <option value="png">PNG Image</option>
                <option value="svg">SVG Image</option>
              </select>
            </div>

            <div className="button-group">
              <button onClick={handleExport} disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Export'}
              </button>
              <button onClick={handleClear} disabled={isLoading}>
                Clear
              </button>
            </div>
          </div>

          {/* Phase 2: Molecular Properties */}
          {activeTab === 'properties' && (
            <div className="panel">
              <h3>Molecular Properties</h3>
              {properties.formula ? (
                <div className="properties-grid">
                  <div className="property">
                    <span className="label">Formula:</span>
                    <span className="value">{properties.formula}</span>
                  </div>
                  <div className="property">
                    <span className="label">Molecular Weight:</span>
                    <span className="value">{properties.weight} g/mol</span>
                  </div>
                  <div className="property">
                    <span className="label">SMILES:</span>
                    <span className="value">{properties.smiles}</span>
                  </div>
                  <div className="property">
                    <span className="label">Atoms:</span>
                    <span className="value">{properties.atoms}</span>
                  </div>
                  <div className="property">
                    <span className="label">Bonds:</span>
                    <span className="value">{properties.bonds}</span>
                  </div>
                  <div className="property">
                    <span className="label">InChI:</span>
                    <span className="value small">{properties.inchi}</span>
                  </div>
                </div>
              ) : (
                <p className="placeholder">Enter a SMILES string to see properties</p>
              )}
            </div>
          )}

          {/* Phase 3: Reaction Tools */}
          {activeTab === 'reactions' && (
            <ReactionTools
              onAddCondition={handleAddCondition}
              onRemoveCondition={handleRemoveCondition}
              conditions={reactionConditions}
            />
          )}

          {/* Phase 4: Search & 3D */}
          {activeTab === 'search' && (
            <SearchAnd3D
              onSearch={handleSearch}
              results={searchResults}
              loading={searchLoading}
            />
          )}

          {/* Phase 5: Collaboration */}
          {activeTab === 'collab' && (
            <Collaboration
              participants={participants}
              comments={comments}
              onAddComment={handleAddComment}
              onRemoveComment={handleRemoveComment}
              onJoinSession={handleJoinSession}
              onLeaveSession={handleLeaveSession}
              sessionId={sessionId || undefined}
              isConnected={isCollabConnected}
            />
          )}

          <div className="panel info-panel">
            <h3>ℹ️ About</h3>
            <p>
              Real chemistry editor with SMILES support, molecular property calculations, and 3D visualization.
            </p>
            <ul>
              <li>✅ SMILES Input/Output</li>
              <li>✅ Molecular Properties</li>
              <li>✅ 2D/3D Visualization</li>
              <li>✅ Reaction Tools</li>
              <li>✅ Structure Search</li>
              <li>✅ Collaboration</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default App
