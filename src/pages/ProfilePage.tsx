import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getBadges } from '../firebase/progress'
import { logOut } from '../firebase/auth'
import { getAvatar } from '../data/avatars'
import { lessons } from '../data/lessons'
import { getGlossaryEntry } from '../data/glossary'
import BadgeMedal from '../components/BadgeMedal'
import AvatarIcon from '../components/AvatarIcon'
import { BADGE_META } from '../logic/badgeLogic'
import type { BadgeRecord, BadgeType } from '../types'

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden focusable="false">
      <rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor" />
      <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

/** A friendly rank that grows as more rooms are cleared. */
function rankFor(cleared: number): string {
  if (cleared >= 7) return 'Master Detective'
  if (cleared >= 5) return 'Senior Detective'
  if (cleared >= 3) return 'Field Detective'
  if (cleared >= 1) return 'Junior Detective'
  return 'Rookie'
}

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [badges, setBadges] = useState<BadgeRecord[]>([])

  useEffect(() => {
    let active = true
    async function load() {
      if (!user) return
      try {
        const list = await getBadges(user.uid)
        if (active) setBadges(list)
      } catch (err) {
        console.error('Failed to load badges', err)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [user])

  const badgeByLesson = useMemo(() => {
    const map: Record<string, BadgeType> = {}
    for (const b of badges) map[b.lessonId] = b.badgeType
    return map
  }, [badges])

  const badgeCounts = useMemo(() => {
    const counts: Record<BadgeType, number> = { gold: 0, silver: 0, bronze: 0, retry: 0 }
    for (const b of badges) counts[b.badgeType] += 1
    return counts
  }, [badges])

  if (!profile) return null

  const avatar = getAvatar(profile.avatarId)
  const completed = profile.completedLessonIds
  const unlocked = profile.unlockedLessonIds
  const total = lessons.length
  const masteryPct = Math.round((completed.length / total) * 100)

  // Concepts learned = the de-duplicated tags from every cleared room.
  const conceptTags = Array.from(
    new Set(
      lessons
        .filter((l) => completed.includes(l.id))
        .flatMap((l) => l.conceptTags),
    ),
  )

  async function handleLogout() {
    try {
      await logOut()
    } catch {
      /* ignore */
    }
    navigate('/auth', { replace: true })
  }

  function roomStatus(lessonId: string): 'completed' | 'unlocked' | 'locked' {
    if (completed.includes(lessonId)) return 'completed'
    if (unlocked.includes(lessonId)) return 'unlocked'
    return 'locked'
  }

  function openRoom(lessonId: string) {
    const status = roomStatus(lessonId)
    if (status === 'locked') return
    navigate(status === 'completed' ? `/review/${lessonId}` : `/lesson/${lessonId}`)
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/hallway')}>
          ← Hallway
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleLogout}>
          Log out
        </button>
      </div>

      {/* Hero: identity + overall mastery */}
      <div className="card card-elevated profile-hero">
        <div className="avatar-pill profile-hero-avatar">
          <AvatarIcon id={avatar.id} size={76} />
        </div>
        <div className="profile-hero-info">
          <h2 style={{ margin: 0 }}>{profile.displayName}</h2>
          <p className="muted" style={{ margin: '2px 0 8px' }}>
            {profile.email}
          </p>
          <span className="rank-pill">{rankFor(completed.length)}</span>
          <div className="mastery">
            <div className="mastery-head">
              <span className="step-counter">Case mastery</span>
              <span className="step-counter">{masteryPct}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${masteryPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="stat-num">
            {completed.length}/{total}
          </div>
          <div className="stat-label">Rooms cleared</div>
        </div>
        <div className="stat">
          <div className="stat-num">{profile.streakCount}</div>
          <div className="stat-label">Day streak</div>
        </div>
        <div className="stat">
          <div className="stat-num">{badges.length}</div>
          <div className="stat-label">Badges</div>
        </div>
      </div>

      {/* Badge breakdown */}
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Badges earned</h3>
        {badges.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No badges yet. Crack a case to earn your first one, rookie.
          </p>
        ) : (
          <div className="badge-breakdown">
            {(['gold', 'silver', 'bronze', 'retry'] as BadgeType[])
              .filter((t) => badgeCounts[t] > 0)
              .map((t) => (
                <div key={t} className="badge-tally">
                  <BadgeMedal type={t} size={34} />
                  <div>
                    <div className="badge-tally-num">{badgeCounts[t]}</div>
                    <div className="badge-tally-label">{BADGE_META[t].label}</div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Case files: per-room progress */}
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>Case files</h3>
        <div className="case-files">
          {lessons.map((lesson, i) => {
            const status = roomStatus(lesson.id)
            const badge = badgeByLesson[lesson.id]
            return (
              <button
                key={lesson.id}
                type="button"
                className={`case-file ${status}`}
                onClick={() => openRoom(lesson.id)}
                disabled={status === 'locked'}
                aria-label={`Room ${i + 1}: ${lesson.title} — ${
                  status === 'completed'
                    ? `completed${badge ? `, ${BADGE_META[badge].label}` : ''}`
                    : status
                }`}
              >
                <span className="case-file-num">{i + 1}</span>
                <span className="case-file-body">
                  <span className="case-file-title">{lesson.title}</span>
                  <span className={`case-file-state ${status}`}>
                    {status === 'completed'
                      ? badge
                        ? BADGE_META[badge].label
                        : 'Completed'
                      : status === 'unlocked'
                        ? 'Ready to play'
                        : 'Locked'}
                  </span>
                </span>
                <span className="case-file-mark">
                  {status === 'completed' && badge ? (
                    <BadgeMedal type={badge} size={28} />
                  ) : status === 'locked' ? (
                    <span className="case-file-lock">
                      <LockIcon />
                    </span>
                  ) : (
                    <span className="case-file-go" aria-hidden>
                      →
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Concepts learned */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Concepts you've learned</h3>
        {conceptTags.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Clear a room to start building your detective toolkit.
          </p>
        ) : (
          <div className="btn-row">
            {conceptTags.map((tag) => (
              <span key={tag} className="pill">
                {getGlossaryEntry(tag).term}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
