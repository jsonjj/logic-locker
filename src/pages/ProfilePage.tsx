import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getBadges } from '../firebase/progress'
import { logOut } from '../firebase/auth'
import { getAvatar } from '../data/avatars'
import { lessons } from '../data/lessons'
import Badge from '../components/Badge'
import AvatarIcon from '../components/AvatarIcon'
import type { BadgeRecord } from '../types'

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

  if (!profile) return null

  const avatar = getAvatar(profile.avatarId)

  async function handleLogout() {
    try {
      await logOut()
    } catch {
      /* ignore */
    }
    navigate('/auth', { replace: true })
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

      <div className="card" style={{ textAlign: 'center', marginBottom: 18 }}>
        <div className="avatar-pill" style={{ margin: '0 auto 10px', width: 72, height: 72 }}>
          <AvatarIcon id={avatar.id} size={72} />
        </div>
        <h2 style={{ margin: 0 }}>{profile.displayName}</h2>
        <p className="muted" style={{ margin: '4px 0 0' }}>{profile.email}</p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="stat-num">{profile.completedLessonIds.length}/{lessons.length}</div>
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

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Badges Earned</h3>
        {badges.length === 0 ? (
          <p className="muted">No badges yet. Solve a case to earn your first one, rookie.</p>
        ) : (
          <div className="btn-row">
            {badges.map((b) => (
              <Badge key={b.badgeId} type={b.badgeType} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
