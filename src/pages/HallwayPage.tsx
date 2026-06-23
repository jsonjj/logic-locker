import { useEffect, useState, Fragment } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { lessons } from '../data/lessons'
import { getAllProgress } from '../firebase/progress'
import { logOut } from '../firebase/auth'
import Badge from '../components/Badge'
import BadgeMedal from '../components/BadgeMedal'
import AvatarIcon from '../components/AvatarIcon'
import { BADGE_META } from '../logic/badgeLogic'

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden focusable="false">
      <rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor" />
      <path
        d="M8 10 V7 a4 4 0 0 1 8 0 v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  )
}
import { getAvatar } from '../data/avatars'
import type { LessonProgress } from '../types'

// A solid accent color per room for visual variety (no gradients).
const ROOM_THEMES = [
  '#3b5bdb',
  '#2f9e44',
  '#7048e8',
  '#e8590c',
  '#0c8599',
  '#c2255c',
  '#212a45',
]

type StepState = 'completed' | 'current' | 'locked' | 'unlocked'

export default function HallwayPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgress>>({})

  useEffect(() => {
    let active = true
    async function load() {
      if (!user) return
      try {
        const all = await getAllProgress(user.uid)
        if (!active) return
        const map: Record<string, LessonProgress> = {}
        for (const p of all) map[p.lessonId] = p
        setProgressMap(map)
      } catch (err) {
        console.error('Failed to load progress', err)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [user])

  if (!profile) return null

  const completed = profile.completedLessonIds
  const unlocked = profile.unlockedLessonIds

  // The room the recruit should play next: first unlocked-but-not-completed.
  let currentIndex = lessons.findIndex(
    (l) => unlocked.includes(l.id) && !completed.includes(l.id),
  )
  const allComplete = currentIndex === -1
  if (allComplete) currentIndex = lessons.length - 1

  function stepState(index: number): StepState {
    const id = lessons[index].id
    if (completed.includes(id)) return 'completed'
    if (index === currentIndex && !allComplete) return 'current'
    if (!unlocked.includes(id)) return 'locked'
    return 'unlocked'
  }

  const current = lessons[currentIndex]
  const theme = ROOM_THEMES[currentIndex % ROOM_THEMES.length]
  const prog = progressMap[current.id]
  const stepsDone = prog?.completedStepIds.length ?? 0
  const stepsTotal = current.steps.length
  const inProgress = !allComplete && stepsDone > 0 && prog?.status !== 'completed'
  const earnedBadge = progressMap[current.id]?.earnedBadge ?? null

  const ctaLabel = allComplete ? 'Review Room' : inProgress ? 'Continue Room' : 'Start Room'

  const nextLocked = lessons[currentIndex + 1]
  const showLockedNote = !allComplete && nextLocked && !unlocked.includes(nextLocked.id)

  const avatar = getAvatar(profile.avatarId)

  async function handleLogout() {
    try {
      await logOut()
    } catch {
      /* ignore */
    }
    navigate('/auth', { replace: true })
  }

  function goTo(index: number) {
    const state = stepState(index)
    if (state === 'locked') return
    const id = lessons[index].id
    navigate(completed.includes(id) ? `/review/${id}` : `/lesson/${id}`)
  }

  return (
    <div className="hall-wrap">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">LL</span>
          <span>LOGIC LOCKER</span>
        </div>
        <div className="btn-row">
          <Link to="/profile" className="avatar-pill" title="Profile" aria-label="Profile">
            <AvatarIcon id={avatar.id} size={40} />
          </Link>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      <div className="hall-main">
      <div className="row-between" style={{ marginBottom: 6 }}>
        <div>
          <h2 style={{ margin: 0 }}>Hey, Recruit {profile.displayName}</h2>
          <p className="muted" style={{ margin: '2px 0 0' }}>
            {allComplete
              ? 'You cleared every room. Replay any case to sharpen up.'
              : 'Here is your next case. Crack it to unlock the next door.'}
          </p>
        </div>
        <div className="streak-chip">
          <span className="streak-chip-num">{profile.streakCount}</span>
          <span className="streak-chip-label">streak</span>
        </div>
      </div>

      {/* 7 small boxes: the whole course at a glance */}
      <div className="stepper" role="list" aria-label="Course progress">
        {lessons.map((lesson, i) => {
          const state = stepState(i)
          const dotBadge = progressMap[lesson.id]?.earnedBadge
          const dotStyle =
            state === 'completed' && dotBadge
              ? { background: '#fff', borderColor: BADGE_META[dotBadge].color }
              : undefined
          return (
            <Fragment key={lesson.id}>
              {i > 0 && (
                <div className={`step-conn ${completed.includes(lessons[i - 1].id) ? 'done' : ''}`} />
              )}
              <button
                type="button"
                className={`step-dot ${state}`}
                style={dotStyle}
                onClick={() => goTo(i)}
                disabled={state === 'locked'}
                aria-label={`Room ${i + 1}: ${lesson.title} (${state}${dotBadge ? `, ${BADGE_META[dotBadge].label}` : ''})`}
                title={`Room ${i + 1}: ${lesson.title}${dotBadge ? ` — ${BADGE_META[dotBadge].label}` : ''}`}
              >
                {state === 'completed' ? (
                  dotBadge ? (
                    <BadgeMedal type={dotBadge} size={30} />
                  ) : (
                    '✓'
                  )
                ) : state === 'locked' ? (
                  <LockIcon />
                ) : (
                  i + 1
                )}
              </button>
            </Fragment>
          )
        })}
      </div>

      {/* Featured current room */}
      <div className="room-feature">
        <div className="room-banner" style={{ background: theme }}>
          <span className="room-vents" aria-hidden />
          <span className="room-handle" aria-hidden />
          <span className="room-banner-num">{currentIndex + 1}</span>
          <div className="room-kicker">
            {allComplete ? 'Course Complete' : inProgress ? 'In Progress' : 'Next Case'} ·{' '}
            {current.doorLabel}
          </div>
          <h3 className="room-banner-title">{current.title}</h3>
          <p className="room-banner-sub">{current.subtitle}</p>
        </div>

        <div className="room-body">
          <div className="room-meta">
            <span className="pill">{current.estimatedMinutes} min</span>
            <span className="pill">{stepsTotal} steps</span>
            {current.conceptTags.slice(0, 2).map((tag) => (
              <span key={tag} className="pill">
                {tag}
              </span>
            ))}
            {earnedBadge && <Badge type={earnedBadge} />}
          </div>

          {inProgress && (
            <>
              <div className="room-progress-row">
                <span className="step-counter">
                  Step {stepsDone} of {stepsTotal}
                </span>
                <span className="step-counter">
                  {Math.round((stepsDone / stepsTotal) * 100)}%
                </span>
              </div>
              <div className="progress-track" style={{ marginBottom: 16 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${(stepsDone / stepsTotal) * 100}%` }}
                />
              </div>
            </>
          )}

          <button
            type="button"
            className="btn btn-primary btn-block cta-lg"
            onClick={() =>
              navigate(allComplete ? `/review/${current.id}` : `/lesson/${current.id}`)
            }
          >
            {ctaLabel}
          </button>

          {showLockedNote && (
            <p className="room-locked-note">
              Room {currentIndex + 2} stays locked until you finish this one.
            </p>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
