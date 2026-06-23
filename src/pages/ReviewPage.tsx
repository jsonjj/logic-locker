import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getLesson } from '../data/lessons'
import { getLessonProgress } from '../firebase/progress'
import { isInteractiveStep } from '../logic/stepUtils'
import { getGlossaryEntry } from '../data/glossary'
import { BADGE_META } from '../logic/badgeLogic'
import Badge from '../components/Badge'
import type { LessonProgress } from '../types'

type Tab = 'answers' | 'terms'

export default function ReviewPage() {
  const { lessonId = '' } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const lesson = getLesson(lessonId)

  const [progress, setProgress] = useState<LessonProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('answers')

  const completed = profile?.completedLessonIds.includes(lessonId) ?? false

  useEffect(() => {
    let active = true
    async function load() {
      if (!user || !lesson) return
      try {
        const p = await getLessonProgress(user.uid, lesson.id)
        if (active) setProgress(p)
      } catch (err) {
        console.error('Failed to load review', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [user, lesson])

  if (!lesson || !completed) {
    return <Navigate to="/hallway" replace />
  }

  const questions = lesson.steps.filter(isInteractiveStep)
  const answerFor = (id: string) => progress?.answers?.[id]
  const firstTryCount = questions.filter((s) => {
    const a = answerFor(s.id)
    return a?.isCorrect && a.attempts === 1
  }).length
  const struggledCount = questions.filter((s) => {
    const a = answerFor(s.id)
    return a && a.attempts > 1
  }).length

  const earnedBadge = progress?.earnedBadge ?? null

  return (
    <div className="app-shell">
      <div className="topbar">
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/hallway')}>
          ← Hallway
        </button>
        <span className="pill">{lesson.doorLabel}</span>
      </div>

      <div className="card review-head">
        <div className="review-head-top">
          <div>
            <div className="review-kicker">Case Review</div>
            <h2 style={{ margin: '2px 0 4px' }}>{lesson.title}</h2>
            <p className="muted" style={{ margin: 0 }}>{lesson.subtitle}</p>
          </div>
          {earnedBadge && <Badge type={earnedBadge} large />}
        </div>

        <div className="stat-grid" style={{ marginTop: 16 }}>
          <div className="stat">
            <div className="stat-num">{firstTryCount}</div>
            <div className="stat-label">Aced first try</div>
          </div>
          <div className="stat">
            <div className="stat-num">{struggledCount}</div>
            <div className="stat-label">Needed retries</div>
          </div>
          <div className="stat">
            <div className="stat-num">{progress?.mistakes ?? 0}</div>
            <div className="stat-label">Total mistakes</div>
          </div>
        </div>
      </div>

      <div className="review-tabs">
        <button
          type="button"
          className={`btn btn-block ${tab === 'answers' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ flex: 1 }}
          onClick={() => setTab('answers')}
        >
          Your Answers
        </button>
        <button
          type="button"
          className={`btn btn-block ${tab === 'terms' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ flex: 1 }}
          onClick={() => setTab('terms')}
        >
          Key Terms
        </button>
      </div>

      {loading ? (
        <div className="card center muted">Loading your case file…</div>
      ) : tab === 'answers' ? (
        <div className="stack">
          {questions.map((step, i) => {
            const a = answerFor(step.id)
            const firstTry = a?.isCorrect && a.attempts === 1
            const struggled = a && a.attempts > 1
            const statusClass = firstTry ? 'ok' : struggled ? 'warn' : 'none'
            const statusText = firstTry
              ? 'Aced first try'
              : struggled
                ? `Took ${a!.attempts} tries`
                : 'Not recorded'
            return (
              <div key={step.id} className={`review-q ${statusClass}`}>
                <div className="review-q-num">{i + 1}</div>
                <div className="review-q-body">
                  <p className="review-q-prompt">{step.prompt}</p>
                  <span className={`review-q-chip ${statusClass}`}>{statusText}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="stack">
          {lesson.conceptTags.map((tag) => {
            const entry = getGlossaryEntry(tag)
            return (
              <div key={tag} className="review-term">
                <div className="review-term-name">{entry.term}</div>
                {entry.definition && <p className="review-term-def">{entry.definition}</p>}
              </div>
            )
          })}
        </div>
      )}

      <div className="card review-retry">
        <div>
          <div className="review-retry-title">Think you can do better?</div>
          <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.9rem' }}>
            {earnedBadge
              ? `Your best badge is ${BADGE_META[earnedBadge].label}. Retry to beat it.`
              : 'Retry this room to earn a badge.'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/lesson/${lesson.id}`)}
        >
          Retry Room
        </button>
      </div>
    </div>
  )
}
