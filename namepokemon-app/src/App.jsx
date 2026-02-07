import { useState, useEffect, useRef, useCallback } from 'react'
import { POKEMON_LIST } from './pokemonList'
import './App.css'

const INITIAL_TIME = 60
const BONUS_TIME = 6

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const pokemonSet = new Map(
  POKEMON_LIST.map(name => [normalize(name), name])
)

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function App() {
  const [gameState, setGameState] = useState('idle') // idle | playing | ended
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME)
  const [guessed, setGuessed] = useState([])
  const [guessedSet, setGuessedSet] = useState(new Set())
  const [message, setMessage] = useState(null) // { text, type: 'error' | 'bonus' }
  const [showBonus, setShowBonus] = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const bonusTimeoutRef = useRef(null)
  const messageTimeoutRef = useRef(null)

  const endGame = useCallback(() => {
    setGameState('ended')
    clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            setGameState('ended')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timerRef.current)
    }
  }, [gameState])

  const startGame = () => {
    setGameState('idle')
    setInput('')
    setTimeLeft(INITIAL_TIME)
    setGuessed([])
    setGuessedSet(new Set())
    setMessage(null)
    setShowBonus(false)
    clearTimeout(bonusTimeoutRef.current)
    clearTimeout(messageTimeoutRef.current)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setInput(value)

    if (gameState === 'idle' && value.length > 0) {
      setGameState('playing')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (gameState !== 'playing' || !input.trim()) return

    const normalized = normalize(input)
    const match = pokemonSet.get(normalized)

    if (!match) {
      setMessage({ text: 'Not a recognised Pokemon!', type: 'error' })
      clearTimeout(messageTimeoutRef.current)
      messageTimeoutRef.current = setTimeout(() => setMessage(null), 2000)
      return
    }

    if (guessedSet.has(normalized)) {
      setMessage({ text: 'Already guessed!', type: 'error' })
      clearTimeout(messageTimeoutRef.current)
      messageTimeoutRef.current = setTimeout(() => setMessage(null), 2000)
      return
    }

    // Correct guess
    setGuessed(prev => [match, ...prev])
    setGuessedSet(prev => new Set(prev).add(normalized))
    setInput('')
    setMessage(null)

    // Add bonus time
    setTimeLeft(prev => prev + BONUS_TIME)
    setShowBonus(true)
    clearTimeout(bonusTimeoutRef.current)
    bonusTimeoutRef.current = setTimeout(() => setShowBonus(false), 1000)
  }

  const score = guessed.length

  return (
    <div className="app">
      <h1 className="title">Name Pokemon Until Failure</h1>

      <div className="timer-container">
        <span className={`timer ${timeLeft <= 10 && gameState === 'playing' ? 'timer-danger' : ''}`}>
          {formatTime(timeLeft)}
        </span>
        {showBonus && <span className="bonus">+{BONUS_TIME}</span>}
      </div>

      <div className="score">
        Score: <span className="score-value">{score}</span>
        <span className="score-total"> / {pokemonSet.size}</span>
      </div>

      {gameState === 'ended' ? (
        <div className="game-over">
          <h2>Time's Up!</h2>
          <p>You named <strong>{score}</strong> Pokemon!</p>
          <button className="restart-btn" onClick={startGame}>Play Again</button>
        </div>
      ) : (
        <>
          <div className="input-area">
            {message && (
              <div className={`message message-${message.type}`}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                className="pokemon-input"
                value={input}
                onChange={handleInputChange}
                placeholder={gameState === 'idle' ? 'Start typing to begin...' : 'Name a Pokemon...'}
                autoFocus
              />
            </form>
          </div>
        </>
      )}

      {guessed.length > 0 && (
        <div className="guessed-list">
          <h3>Guessed ({guessed.length})</h3>
          <div className="guessed-grid">
            {guessed.map((name, i) => (
              <span key={i} className="guessed-item">{name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
