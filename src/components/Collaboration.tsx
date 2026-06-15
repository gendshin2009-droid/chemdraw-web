import { useState } from 'react'
import '../styles/Collaboration.css'

export interface Participant {
  id: string
  name: string
  color: string
  cursor?: { x: number; y: number }
  isActive: boolean
}

export interface Comment {
  id: string
  author: string
  text: string
  timestamp: Date
  atomId?: string
}

interface CollaborationProps {
  participants?: Participant[]
  comments?: Comment[]
  onAddComment?: (text: string) => void
  onRemoveComment?: (id: string) => void
  onJoinSession?: (userName: string) => void
  onLeaveSession?: () => void
  sessionId?: string
  isConnected?: boolean
}

export function Collaboration({
  participants = [],
  comments = [],
  onAddComment,
  onRemoveComment,
  onJoinSession,
  onLeaveSession,
  sessionId,
  isConnected = false,
}: CollaborationProps) {
  const [userName, setUserName] = useState('')
  const [isJoined, setIsJoined] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [versionHistory] = useState<
    Array<{ id: string; timestamp: Date; author: string; changes: string }>
  >([])

  const handleJoinSession = () => {
    if (!userName.trim()) return
    onJoinSession?.(userName)
    setIsJoined(true)
  }

  const handleLeaveSession = () => {
    onLeaveSession?.()
    setIsJoined(false)
    setUserName('')
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return
    onAddComment?.(commentText)
    setCommentText('')
  }

  return (
    <div className="collaboration">
      <div className="session-info">
        <h3>Real-Time Collaboration</h3>

        {!isJoined ? (
          <div className="join-session">
            <div className="join-controls">
              <input
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleJoinSession()
                }}
              />
              <button onClick={handleJoinSession}>Join Session</button>
            </div>
            <p className="session-hint">
              {sessionId ? `Session ID: ${sessionId}` : 'No active session'}
            </p>
          </div>
        ) : (
          <div className="session-active">
            <div className="session-header">
              <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </span>
              <button className="leave-btn" onClick={handleLeaveSession}>
                Leave Session
              </button>
            </div>

            <div className="participants">
              <h4>Participants ({participants.length})</h4>
              <div className="participants-list">
                {participants.map((p) => (
                  <div key={p.id} className="participant">
                    <div
                      className="participant-avatar"
                      style={{ backgroundColor: p.color }}
                      title={p.name}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="participant-info">
                      <div className="participant-name">{p.name}</div>
                      <div className={`participant-status ${p.isActive ? 'active' : 'idle'}`}>
                        {p.isActive ? 'Editing' : 'Idle'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="comments-section">
              <h4>Comments & Annotations</h4>

              <div className="comment-input">
                <textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                />
                <button onClick={handleAddComment} disabled={!commentText.trim()}>
                  Post Comment
                </button>
              </div>

              {comments.length > 0 && (
                <div className="comments-list">
                  {comments.map((comment) => (
                    <div key={comment.id} className="comment">
                      <div className="comment-header">
                        <span className="comment-author">{comment.author}</span>
                        <span className="comment-time">
                          {comment.timestamp.toLocaleTimeString()}
                        </span>
                        <button
                          className="delete-comment"
                          onClick={() => onRemoveComment?.(comment.id)}
                          title="Delete comment"
                        >
                          ×
                        </button>
                      </div>
                      <div className="comment-text">{comment.text}</div>
                      {comment.atomId && (
                        <div className="comment-atom">Atom: {comment.atomId}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {comments.length === 0 && (
                <div className="no-comments">No comments yet</div>
              )}
            </div>

            <div className="history-section">
              <button
                className={`history-toggle ${showHistory ? 'active' : ''}`}
                onClick={() => setShowHistory(!showHistory)}
              >
                📜 Version History
              </button>

              {showHistory && (
                <div className="version-history">
                  {versionHistory.length > 0 ? (
                    <div className="history-list">
                      {versionHistory.map((v) => (
                        <div key={v.id} className="history-item">
                          <div className="history-time">{v.timestamp.toLocaleString()}</div>
                          <div className="history-author">{v.author}</div>
                          <div className="history-changes">{v.changes}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-history">No version history yet</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="collab-info">
        <h4>Collaboration Features</h4>
        <ul>
          <li>
            <strong>Real-time Sync:</strong> Changes synchronized instantly via WebSocket
          </li>
          <li>
            <strong>Presence:</strong> See who's editing and their cursor position
          </li>
          <li>
            <strong>Comments:</strong> Annotate structures with comments
          </li>
          <li>
            <strong>Version History:</strong> Track all changes with timestamps
          </li>
          <li>
            <strong>Conflict Resolution:</strong> CRDT-based conflict-free merging
          </li>
          <li>
            <strong>Offline Support:</strong> Changes sync when reconnected
          </li>
        </ul>
      </div>
    </div>
  )
}
