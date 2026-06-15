import { useRef, useState, useEffect } from 'react'
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

interface Atom {
  id: string
  x: number
  y: number
  element: string
  charge: number
}

interface Bond {
  id: string
  atom1Id: string
  atom2Id: string
  type: 'single' | 'double' | 'triple' | 'aromatic'
}

// Calculate molecular properties from atoms and bonds
const calculateProperties = (atoms: Atom[], bonds: Bond[]): MolecularPropertiesData => {
  const atomicMasses: { [key: string]: number } = {
    'C': 12.011, 'N': 14.007, 'O': 15.999, 'H': 1.008,
    'S': 32.06, 'P': 30.974, 'F': 18.998, 'Cl': 35.45,
  }

  let weight = 0
  let formula = ''
  const elementCount: { [key: string]: number } = {}

  atoms.forEach((atom) => {
    if (atomicMasses[atom.element]) {
      weight += atomicMasses[atom.element]
      elementCount[atom.element] = (elementCount[atom.element] || 0) + 1
    }
  })

  formula = Object.entries(elementCount)
    .map(([el, count]) => el + (count > 1 ? count : ''))
    .join('')

  return {
    formula: formula || 'Unknown',
    weight: Math.round(weight * 100) / 100,
    atoms: atoms.length,
    bonds: bonds.length,
  }
}

// SMILES to atoms converter (simplified)
const smilesToAtoms = (smiles: string): { atoms: Atom[]; bonds: Bond[] } => {
  const atoms: Atom[] = []
  const bonds: Bond[] = []
  let atomId = 0
  const atomMap: { [key: number]: string } = {}

  const atomRegex = /[A-Z][a-z]?|\[.*?\]|[0-9]/g
  const matches = smiles.match(atomRegex) || []

  matches.forEach((match, index) => {
    if (/^[A-Z][a-z]?$/.test(match)) {
      const x = index * 60 + 50
      const y = 200
      atoms.push({
        id: `atom_${atomId}`,
        x,
        y,
        element: match,
        charge: 0,
      })
      atomMap[atomId] = `atom_${atomId}`
      atomId++

      // Create bond to previous atom
      if (atomId > 1) {
        bonds.push({
          id: `bond_${bonds.length}`,
          atom1Id: atomMap[atomId - 2],
          atom2Id: atomMap[atomId - 1],
          type: 'single',
        })
      }
    }
  })

  return { atoms, bonds }
}

// 2D Canvas Renderer
const Canvas2D = ({ atoms, bonds, selectedAtom, onAtomClick }: {
  atoms: Atom[]
  bonds: Bond[]
  selectedAtom: string | null
  onAtomClick: (atomId: string) => void
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 0.5
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }
    for (let i = 0; i < canvas.height; i += 20) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }

    // Draw bonds
    bonds.forEach((bond) => {
      const atom1 = atoms.find((a) => a.id === bond.atom1Id)
      const atom2 = atoms.find((a) => a.id === bond.atom2Id)
      if (!atom1 || !atom2) return

      ctx.strokeStyle = '#333'
      ctx.lineWidth = bond.type === 'double' ? 3 : bond.type === 'triple' ? 4 : 2
      ctx.beginPath()
      ctx.moveTo(atom1.x, atom1.y)
      ctx.lineTo(atom2.x, atom2.y)
      ctx.stroke()
    })

    // Draw atoms
    atoms.forEach((atom) => {
      const isSelected = atom.id === selectedAtom
      const radius = 20

      // Draw circle
      ctx.fillStyle = isSelected ? '#667eea' : '#e0e7ff'
      ctx.strokeStyle = isSelected ? '#667eea' : '#999'
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.beginPath()
      ctx.arc(atom.x, atom.y, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Draw element symbol
      ctx.fillStyle = isSelected ? 'white' : '#333'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(atom.element, atom.x, atom.y)
    })
  }, [atoms, bonds, selectedAtom])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicked on an atom
    atoms.forEach((atom) => {
      const distance = Math.sqrt((atom.x - x) ** 2 + (atom.y - y) ** 2)
      if (distance < 25) {
        onAtomClick(atom.id)
      }
    })
  }

  return (
    <canvas
      ref={canvasRef}
      className="chemistry-canvas"
      onClick={handleCanvasClick}
    />
  )
}

function App() {
  const [atoms, setAtoms] = useState<Atom[]>([])
  const [bonds, setBonds] = useState<Bond[]>([])
  const [selectedAtom, setSelectedAtom] = useState<string | null>(null)
  const [properties, setProperties] = useState<MolecularPropertiesData>({})
  const [smilesInput, setSmilesInput] = useState('c1ccccc1')
  const [exportFormat, setExportFormat] = useState<'mol' | 'smiles' | 'inchi' | 'png'>('mol')
  const [activeTab, setActiveTab] = useState<'draw' | 'properties' | 'reactions' | 'search' | 'collab'>('draw')
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

  // Update properties when atoms/bonds change
  useEffect(() => {
    const props = calculateProperties(atoms, bonds)
    setProperties(props)
  }, [atoms, bonds])

  // Add atom to canvas
  const addAtom = (element: string) => {
    const newAtom: Atom = {
      id: `atom_${Date.now()}`,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      element,
      charge: 0,
    }
    setAtoms([...atoms, newAtom])
  }

  // Add bond between selected atom and new atom (for future use)
  // const addBond = (atom1Id: string, atom2Id: string, type: 'single' | 'double' | 'aromatic' = 'single') => {
  //   const newBond: Bond = {
  //     id: `bond_${Date.now()}`,
  //     atom1Id,
  //     atom2Id,
  //     type,
  //   }
  //   setBonds([...bonds, newBond])
  // }

  // Add benzene ring
  const addBenzeneRing = () => {
    const centerX = 200
    const centerY = 200
    const radius = 60
    const newAtoms: Atom[] = []
    const newBonds: Bond[] = []

    // Create 6 carbon atoms in a ring
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      const atomId = `atom_${Date.now()}_${i}`
      newAtoms.push({
        id: atomId,
        x,
        y,
        element: 'C',
        charge: 0,
      })
    }

    // Create bonds in a ring
    for (let i = 0; i < 6; i++) {
      const nextI = (i + 1) % 6
      newBonds.push({
        id: `bond_${Date.now()}_${nextI}`,
        atom1Id: newAtoms[i].id,
        atom2Id: newAtoms[nextI].id,
        type: i % 2 === 0 ? 'double' : 'single',
      })
    }

    setAtoms([...atoms, ...newAtoms])
    setBonds([...bonds, ...newBonds])
  }

  // Load from SMILES
  const loadFromSmiles = () => {
    const { atoms: newAtoms, bonds: newBonds } = smilesToAtoms(smilesInput)
    setAtoms(newAtoms)
    setBonds(newBonds)
  }

  // Clear canvas
  const clearCanvas = () => {
    setAtoms([])
    setBonds([])
    setSelectedAtom(null)
  }

  // Export
  const handleExport = () => {
    if (exportFormat === 'mol') {
      // Simple MOL file format
      const molContent = `\n  Generated by ChemDraw\n\n  ${atoms.length}  ${bonds.length}  0  0  0  0  0  0  0  0999 V2000\n${atoms
        .map((a) => `    ${a.x.toFixed(4)}    ${a.y.toFixed(4)}    0.0000 ${a.element}   0  0  0  0  0  0  0  0  0  0  0  0\n`)
        .join('')}${bonds
        .map((b) => {
          const atom1Index = atoms.findIndex((a) => a.id === b.atom1Id) + 1
          const atom2Index = atoms.findIndex((a) => a.id === b.atom2Id) + 1
          const bondType = b.type === 'double' ? 2 : b.type === 'triple' ? 3 : 1
          return `  ${atom1Index}  ${atom2Index}  ${bondType}  0  0  0  0\n`
        })
        .join('')}M  END`
      downloadFile(molContent, 'structure.mol', 'text/plain')
    } else if (exportFormat === 'smiles') {
      downloadFile(smilesInput, 'structure.smi', 'text/plain')
    } else if (exportFormat === 'inchi') {
      downloadFile(`InChI=1S/${properties.formula}`, 'structure.inchi', 'text/plain')
    } else if (exportFormat === 'png') {
      const canvas = document.querySelector('.chemistry-canvas') as HTMLCanvasElement
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = 'structure.png'
        link.click()
      }
    }
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
      const mockResults: SearchResult[] = [
        { id: '1', name: 'Benzene', smiles: 'c1ccccc1', similarity: 0.95, source: 'ChEMBL' },
        { id: '2', name: 'Toluene', smiles: 'Cc1ccccc1', similarity: 0.88, source: 'PubChem' },
        { id: '3', name: 'Xylene', smiles: 'Cc1ccc(C)cc1', similarity: 0.82, source: 'ChEMBL' },
      ]
      setSearchResults(mockResults)
    } finally {
      setSearchLoading(false)
    }
  }

  // Phase 5: Handle collaboration
  const handleJoinSession = (userName: string) => {
    const newSessionId = `session_${Date.now()}`
    setSessionId(newSessionId)
    setParticipants([{
      id: `user_${Date.now()}`,
      name: userName,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      isActive: true,
    }])
    setIsCollabConnected(true)
  }

  const handleLeaveSession = () => {
    setSessionId(null)
    setParticipants([])
    setComments([])
    setIsCollabConnected(false)
  }

  const handleAddComment = (text: string) => {
    setComments([...comments, {
      id: `comment_${Date.now()}`,
      author: participants[0]?.name || 'Anonymous',
      text,
      timestamp: new Date(),
    }])
  }

  const handleRemoveComment = (id: string) => {
    setComments(comments.filter((c) => c.id !== id))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧪 ChemDraw Web - Molecular Editor</h1>
        <p>Draw and visualize chemical structures</p>
      </header>

      <div className="app-container">
        <div className="editor-section">
          <Canvas2D
            atoms={atoms}
            bonds={bonds}
            selectedAtom={selectedAtom}
            onAtomClick={setSelectedAtom}
          />
          <div className="canvas-controls">
            <button onClick={clearCanvas} className="btn-clear">Clear</button>
            <button onClick={() => setView3D(!view3D)} className="btn-3d">
              {view3D ? '2D' : '3D'}
            </button>
          </div>
        </div>

        <aside className="sidebar">
          <div className="tabs">
            <button className={`tab ${activeTab === 'draw' ? 'active' : ''}`} onClick={() => setActiveTab('draw')}>
              Draw
            </button>
            <button className={`tab ${activeTab === 'properties' ? 'active' : ''}`} onClick={() => setActiveTab('properties')}>
              Properties
            </button>
            <button className={`tab ${activeTab === 'reactions' ? 'active' : ''}`} onClick={() => setActiveTab('reactions')}>
              Reactions
            </button>
            <button className={`tab ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
              Search
            </button>
            <button className={`tab ${activeTab === 'collab' ? 'active' : ''}`} onClick={() => setActiveTab('collab')}>
              Collab
            </button>
          </div>

          {/* Draw Tools */}
          {activeTab === 'draw' && (
            <div className="panel">
              <h3>Add Atoms</h3>
              <div className="atom-buttons">
                <button onClick={() => addAtom('C')} className="atom-btn carbon">C</button>
                <button onClick={() => addAtom('N')} className="atom-btn nitrogen">N</button>
                <button onClick={() => addAtom('O')} className="atom-btn oxygen">O</button>
                <button onClick={() => addAtom('S')} className="atom-btn sulfur">S</button>
                <button onClick={() => addAtom('P')} className="atom-btn phosphorus">P</button>
                <button onClick={() => addAtom('H')} className="atom-btn hydrogen">H</button>
              </div>

              <h3>Rings</h3>
              <div className="ring-buttons">
                <button onClick={addBenzeneRing} className="ring-btn">Benzene</button>
              </div>

              <h3>Load from SMILES</h3>
              <textarea
                value={smilesInput}
                onChange={(e) => setSmilesInput(e.target.value)}
                placeholder="e.g., c1ccccc1"
                className="smiles-input"
              />
              <button onClick={loadFromSmiles} className="btn-load">Load</button>
            </div>
          )}

          {/* Properties */}
          {activeTab === 'properties' && (
            <div className="panel">
              <h3>Molecular Properties</h3>
              {atoms.length > 0 ? (
                <div className="properties-grid">
                  <div className="property">
                    <span>Formula:</span>
                    <span>{properties.formula}</span>
                  </div>
                  <div className="property">
                    <span>Weight:</span>
                    <span>{properties.weight} g/mol</span>
                  </div>
                  <div className="property">
                    <span>Atoms:</span>
                    <span>{properties.atoms}</span>
                  </div>
                  <div className="property">
                    <span>Bonds:</span>
                    <span>{properties.bonds}</span>
                  </div>
                </div>
              ) : (
                <p className="placeholder">Draw a molecule to see properties</p>
              )}

              <h3>Export</h3>
              <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)}>
                <option value="mol">MOL File</option>
                <option value="smiles">SMILES</option>
                <option value="inchi">InChI</option>
                <option value="png">PNG</option>
              </select>
              <button onClick={handleExport} className="btn-export">Export</button>
            </div>
          )}

          {/* Reactions */}
          {activeTab === 'reactions' && (
            <ReactionTools
              onAddCondition={handleAddCondition}
              onRemoveCondition={handleRemoveCondition}
              conditions={reactionConditions}
            />
          )}

          {/* Search */}
          {activeTab === 'search' && (
            <SearchAnd3D
              onSearch={handleSearch}
              results={searchResults}
              loading={searchLoading}
            />
          )}

          {/* Collaboration */}
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
