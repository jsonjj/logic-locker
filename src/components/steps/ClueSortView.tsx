import { useState } from 'react'
import type { ClueSortStep } from '../../types'

export default function ClueSortView({
  step,
  locked,
  onResult,
}: {
  step: ClueSortStep
  locked: boolean
  onResult: (isCorrect: boolean, submittedValue: unknown) => void
}) {
  // cardId -> category (or undefined if unplaced)
  const [placements, setPlacements] = useState<Record<string, string | undefined>>({})
  const [activeCard, setActiveCard] = useState<string | null>(null)
  const [evaluated, setEvaluated] = useState(false)

  const unplaced = step.cards.filter((c) => !placements[c.id])

  function selectCard(id: string) {
    if (locked) return
    setActiveCard((prev) => (prev === id ? null : id))
  }

  function placeInCategory(category: string) {
    if (locked || !activeCard) return
    setPlacements((prev) => ({ ...prev, [activeCard]: category }))
    setActiveCard(null)
    setEvaluated(false)
  }

  function removeFromCategory(cardId: string) {
    if (locked) return
    setPlacements((prev) => ({ ...prev, [cardId]: undefined }))
    setEvaluated(false)
  }

  function cardClass(cardId: string): string {
    const classes = ['clue-card']
    if (activeCard === cardId) classes.push('active')
    if (evaluated) {
      classes.push(placements[cardId] === step.correctAnswer[cardId] ? 'right' : 'wrong')
    }
    return classes.join(' ')
  }

  const allPlaced = step.cards.every((c) => placements[c.id])

  function check() {
    const isCorrect = step.cards.every((c) => placements[c.id] === step.correctAnswer[c.id])
    setEvaluated(true)
    onResult(isCorrect, placements)
  }

  return (
    <div>
      {!locked && unplaced.length > 0 && (
        <div className="cluesort-cards">
          <div className="step-counter" style={{ marginBottom: 4 }}>
            Tap a clue, then tap a case file:
          </div>
          {unplaced.map((c) => (
            <button
              key={c.id}
              type="button"
              className={cardClass(c.id)}
              onClick={() => selectCard(c.id)}
            >
              {c.text}
            </button>
          ))}
        </div>
      )}

      <div className="categories">
        {step.categories.map((cat) => {
          const cardsHere = step.cards.filter((c) => placements[c.id] === cat)
          const isTarget = !!activeCard && !locked
          return (
            <div
              key={cat}
              className={`category ${isTarget ? 'targetable' : ''}`}
              onClick={() => placeInCategory(cat)}
              role={isTarget ? 'button' : undefined}
              tabIndex={isTarget ? 0 : undefined}
              aria-label={isTarget ? `Place clue in ${cat}` : undefined}
              onKeyDown={(e) => {
                if (isTarget && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  placeInCategory(cat)
                }
              }}
            >
              <div className="category-title">{cat}</div>
              {cardsHere.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`category-chip ${
                    evaluated
                      ? placements[c.id] === step.correctAnswer[c.id]
                        ? 'right'
                        : 'wrong'
                      : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromCategory(c.id)
                  }}
                  style={
                    evaluated
                      ? {
                          borderColor:
                            placements[c.id] === step.correctAnswer[c.id]
                              ? 'var(--neon-green)'
                              : 'var(--neon-red)',
                        }
                      : undefined
                  }
                >
                  {c.text}
                </button>
              ))}
            </div>
          )
        })}
      </div>

      {!locked && (
        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ marginTop: 14 }}
          onClick={check}
          disabled={!allPlaced}
        >
          Check Case Files
        </button>
      )}
    </div>
  )
}
