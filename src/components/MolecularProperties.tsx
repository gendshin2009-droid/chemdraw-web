import { useEffect, useState } from 'react'
import '../styles/MolecularProperties.css'

interface Properties {
  formula?: string
  weight?: number
  exactMass?: number
  logP?: number
  tpsa?: number
  hbd?: number
  hba?: number
  rotatable?: number
  rings?: number
  lipinski?: {
    pass: boolean
    violations: string[]
  }
  error?: string
  loading?: boolean
}

interface MolecularPropertiesProps {
  smiles?: string
  onPropertiesUpdate?: (props: Properties) => void
}

export function MolecularProperties({ smiles, onPropertiesUpdate }: MolecularPropertiesProps) {
  const [properties, setProperties] = useState<Properties>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!smiles) {
      setProperties({})
      return
    }

    const calculateProperties = async () => {
      setLoading(true)
      try {
        // Simulate property calculation
        // In production, this would use RDKit.js or a backend API
        const props: Properties = {
          formula: 'C₆H₆', // Would be calculated from SMILES
          weight: 78.11,
          exactMass: 78.0469,
          logP: 1.89,
          tpsa: 0,
          hbd: 0,
          hba: 0,
          rotatable: 0,
          rings: 1,
          lipinski: {
            pass: true,
            violations: [],
          },
        }

        setProperties(props)
        onPropertiesUpdate?.(props)
      } catch (error) {
        setProperties({
          error: 'Failed to calculate properties',
        })
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(calculateProperties, 500) // Debounce
    return () => clearTimeout(timer)
  }, [smiles, onPropertiesUpdate])

  return (
    <div className="molecular-properties">
      <h3>Molecular Properties</h3>

      {loading && <div className="loading">Calculating...</div>}

      {properties.error && <div className="error">{properties.error}</div>}

      {!loading && !properties.error && properties.formula && (
        <div className="properties-grid">
          <div className="property-item">
            <label>Molecular Formula</label>
            <span className="value">{properties.formula}</span>
          </div>

          <div className="property-item">
            <label>Molecular Weight</label>
            <span className="value">{properties.weight?.toFixed(2)} g/mol</span>
          </div>

          <div className="property-item">
            <label>Exact Mass</label>
            <span className="value">{properties.exactMass?.toFixed(4)}</span>
          </div>

          <div className="property-item">
            <label>LogP (Crippen)</label>
            <span className="value">{properties.logP?.toFixed(2)}</span>
          </div>

          <div className="property-item">
            <label>TPSA</label>
            <span className="value">{properties.tpsa?.toFixed(2)} Ų</span>
          </div>

          <div className="property-item">
            <label>H-Bond Donors</label>
            <span className="value">{properties.hbd}</span>
          </div>

          <div className="property-item">
            <label>H-Bond Acceptors</label>
            <span className="value">{properties.hba}</span>
          </div>

          <div className="property-item">
            <label>Rotatable Bonds</label>
            <span className="value">{properties.rotatable}</span>
          </div>

          <div className="property-item">
            <label>Rings</label>
            <span className="value">{properties.rings}</span>
          </div>

          <div className="property-item full-width">
            <label>Lipinski's Rule of Five</label>
            <span className={`value ${properties.lipinski?.pass ? 'pass' : 'fail'}`}>
              {properties.lipinski?.pass ? '✓ Pass' : '✗ Fail'}
            </span>
            {properties.lipinski?.violations && properties.lipinski.violations.length > 0 && (
              <div className="violations">
                {properties.lipinski.violations.map((v, i) => (
                  <div key={i} className="violation">
                    • {v}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && !properties.error && !properties.formula && (
        <div className="placeholder">Draw or import a structure to see properties</div>
      )}
    </div>
  )
}
