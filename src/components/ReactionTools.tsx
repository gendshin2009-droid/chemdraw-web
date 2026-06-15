import { useState } from 'react'
import '../styles/ReactionTools.css'

export interface ReactionCondition {
  id: string
  type: 'temperature' | 'catalyst' | 'solvent' | 'time' | 'pressure'
  value: string
}

interface ReactionToolsProps {
  onAddCondition?: (condition: ReactionCondition) => void
  onRemoveCondition?: (id: string) => void
  conditions?: ReactionCondition[]
}

export function ReactionTools({ onAddCondition, onRemoveCondition, conditions = [] }: ReactionToolsProps) {
  const [conditionType, setConditionType] = useState<ReactionCondition['type']>('temperature')
  const [conditionValue, setConditionValue] = useState('')
  const [showStereochemistry, setShowStereochemistry] = useState(false)
  const [showRGroups, setShowRGroups] = useState(false)

  const handleAddCondition = () => {
    if (!conditionValue.trim()) return

    const condition: ReactionCondition = {
      id: Date.now().toString(),
      type: conditionType,
      value: conditionValue,
    }

    onAddCondition?.(condition)
    setConditionValue('')
  }

  return (
    <div className="reaction-tools">
      <h3>Reaction Tools</h3>

      <div className="tool-section">
        <h4>Reaction Conditions</h4>
        <div className="condition-input">
          <select value={conditionType} onChange={(e) => setConditionType(e.target.value as any)}>
            <option value="temperature">Temperature</option>
            <option value="catalyst">Catalyst</option>
            <option value="solvent">Solvent</option>
            <option value="time">Time</option>
            <option value="pressure">Pressure</option>
          </select>
          <input
            type="text"
            placeholder="Enter value"
            value={conditionValue}
            onChange={(e) => setConditionValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleAddCondition()
            }}
          />
          <button onClick={handleAddCondition}>Add</button>
        </div>

        {conditions.length > 0 && (
          <div className="conditions-list">
            {conditions.map((cond) => (
              <div key={cond.id} className="condition-item">
                <span className="condition-type">{cond.type}:</span>
                <span className="condition-value">{cond.value}</span>
                <button
                  className="remove-btn"
                  onClick={() => onRemoveCondition?.(cond.id)}
                  title="Remove condition"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tool-section">
        <h4>Structure Features</h4>
        <div className="feature-buttons">
          <button
            className={`feature-btn ${showStereochemistry ? 'active' : ''}`}
            onClick={() => setShowStereochemistry(!showStereochemistry)}
            title="Toggle stereochemistry tools (wedges, hashes, E/Z)"
          >
            🔄 Stereochemistry
          </button>
          <button
            className={`feature-btn ${showRGroups ? 'active' : ''}`}
            onClick={() => setShowRGroups(!showRGroups)}
            title="Toggle R-groups and S-groups"
          >
            🔀 R-Groups
          </button>
        </div>

        {showStereochemistry && (
          <div className="feature-info">
            <p>
              <strong>Stereochemistry Tools:</strong>
            </p>
            <ul>
              <li>Wedge bonds (solid wedge)</li>
              <li>Hash bonds (dashed wedge)</li>
              <li>Wavy bonds (unknown stereochemistry)</li>
              <li>E/Z notation for alkenes</li>
              <li>R/S configuration labels</li>
            </ul>
          </div>
        )}

        {showRGroups && (
          <div className="feature-info">
            <p>
              <strong>R-Groups & S-Groups:</strong>
            </p>
            <ul>
              <li>Generic R-groups for variable positions</li>
              <li>Repeating units (SRU)</li>
              <li>Superatoms for common fragments</li>
              <li>Multiple group definitions</li>
              <li>Data groups for annotations</li>
            </ul>
          </div>
        )}
      </div>

      <div className="tool-section">
        <h4>Atom Mapping</h4>
        <div className="mapping-info">
          <p>Automatic atom mapping for reaction schemes:</p>
          <ul>
            <li>Maps reactants to products</li>
            <li>Validates reaction balance</li>
            <li>Detects reaction type</li>
            <li>Highlights unmapped atoms</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
