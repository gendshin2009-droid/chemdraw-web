import { useEffect, useRef, useState } from 'react'
import { Editor } from 'ketcher-react'
import 'ketcher-react/dist/index.css'
import './App.css'

interface MolecularProperties {
  formula?: string
  weight?: number
  smiles?: string
  inchi?: string
  error?: string
}

function App() {
  const editorRef = useRef<any>(null)
  const [properties, setProperties] = useState<MolecularProperties>({})
  const [exportFormat, setExportFormat] = useState<'mol' | 'smiles' | 'inchi' | 'png' | 'svg'>('mol')
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async () => {
    if (!editorRef.current) return

    try {
      setIsLoading(true)
      const ketcher = editorRef.current

      if (exportFormat === 'mol') {
        const molfile = await ketcher.getMolfile()
        downloadFile(molfile, 'structure.mol', 'text/plain')
      } else if (exportFormat === 'smiles') {
        const smiles = await ketcher.getSmiles()
        downloadFile(smiles, 'structure.smi', 'text/plain')
      } else if (exportFormat === 'inchi') {
        const inchi = await ketcher.getInchi()
        downloadFile(inchi, 'structure.inchi', 'text/plain')
      } else if (exportFormat === 'png' || exportFormat === 'svg') {
        const dataUrl = await ketcher.generateImage({
          outputFormat: exportFormat,
        })
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = `structure.${exportFormat}`
        link.click()
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
    if (!file || !editorRef.current) return

    try {
      setIsLoading(true)
      const text = await file.text()
      await editorRef.current.setMolecule(text)
      await updateProperties()
    } catch (error) {
      console.error('Import error:', error)
      alert('Error importing structure')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSmilesInput = async (smiles: string) => {
    if (!editorRef.current) return

    try {
      setIsLoading(true)
      await editorRef.current.setMolecule(smiles)
      await updateProperties()
    } catch (error) {
      console.error('SMILES input error:', error)
      alert('Invalid SMILES string')
    } finally {
      setIsLoading(false)
    }
  }

  const updateProperties = async () => {
    if (!editorRef.current) return

    try {
      const smiles = await editorRef.current.getSmiles()
      const inchi = await editorRef.current.getInchi()

      setProperties({
        smiles,
        inchi,
      })
    } catch (error) {
      console.error('Properties update error:', error)
      setProperties({ error: 'Could not calculate properties' })
    }
  }

  const handleClear = async () => {
    if (!editorRef.current) return

    try {
      await editorRef.current.setMolecule('')
      setProperties({})
    } catch (error) {
      console.error('Clear error:', error)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>ChemDraw Web</h1>
        <p>Chemical Structure Editor</p>
      </header>

      <div className="app-container">
        <div className="editor-section">
          <div className="editor-wrapper">
            <Editor
              ref={editorRef}
              onInit={() => {
                console.log('Ketcher editor initialized')
              }}
              onChange={() => {
                updateProperties()
              }}
              staticResourcesUrl="https://unpkg.com/ketcher-react@3.15.0/dist/static"
            />
          </div>
        </div>

        <aside className="sidebar">
          <div className="panel">
            <h2>Import/Export</h2>
            <div className="control-group">
              <label htmlFor="file-input">Import Structure:</label>
              <input
                id="file-input"
                type="file"
                accept=".mol,.rxn,.sdf"
                onChange={handleImport}
                disabled={isLoading}
              />
            </div>

            <div className="control-group">
              <label htmlFor="smiles-input">SMILES Input:</label>
              <input
                id="smiles-input"
                type="text"
                placeholder="Enter SMILES string"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSmilesInput((e.target as HTMLInputElement).value)
                  }
                }}
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

          <div className="panel">
            <h2>Molecular Properties</h2>
            <div className="properties">
              {properties.error ? (
                <div className="error">{properties.error}</div>
              ) : (
                <>
                  {properties.smiles && (
                    <div className="property">
                      <label>SMILES:</label>
                      <code>{properties.smiles}</code>
                    </div>
                  )}
                  {properties.inchi && (
                    <div className="property">
                      <label>InChI:</label>
                      <code>{properties.inchi}</code>
                    </div>
                  )}
                  {!properties.smiles && !properties.error && (
                    <p className="placeholder">Draw a structure to see properties</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="panel info-panel">
            <h3>About</h3>
            <p>
              ChemDraw Web is a chemical structure editor built with Ketcher and React.
            </p>
            <p>
              <strong>Phase 1 Features:</strong>
            </p>
            <ul>
              <li>Draw chemical structures</li>
              <li>Import MOL, RXN, SDF files</li>
              <li>Export to multiple formats</li>
              <li>View SMILES and InChI</li>
              <li>Generate PNG/SVG images</li>
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
