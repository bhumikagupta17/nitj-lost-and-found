import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'

const TYPE_ICON = {
  // Legacy claim types (kept for backward compat)
  claim_received: '📬',
  claim_accepted: '🎉',
  claim_rejected: '❌',
  // New flow types
  interest_received: '🙋',   // security sees this: student flagged an item
  item_match: '🔍',          // student sees this: a found item might be theirs
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function NotificationsBell() {
  const navigate = useNavigate()
  const { notifications, unreadCount, loading, markAllRead, markRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleOpen() {
    setOpen(o => !o)
    if (!open && unreadCount > 0) markAllRead()
  }

  function handleClick(n) {
    markRead(n.id)
    setOpen(false)
    const { claim_id, item_id } = n.meta || {}
    // New flow
    if (n.type === 'interest_received') navigate('/security')
    else if (n.type === 'item_match' && item_id) navigate(`/item/${item_id}`)
    // Legacy
    else if (n.type === 'claim_received') navigate('/dashboard')
    else if (n.type === 'claim_accepted' && claim_id) navigate(`/chat/${claim_id}`)
    else if (n.type === 'claim_rejected' && item_id) navigate(`/item/${item_id}`)
    else navigate('/dashboard')
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 flex items-center justify-center rounded-full hover:opacity-70 active:scale-95 transition-all"
        style={{ color: '#6B7280' }}
        title="Notifications"
      >
        <span className="text-lg leading-none">🔔</span>
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-white px-1"
            style={{ backgroundColor: '#1565A7', fontSize: '10px', lineHeight: 1 }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-10 w-80 rounded-2xl shadow-xl border overflow-hidden z-50"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#DCE8F7' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#DCE8F7' }}>
            <p className="text-sm font-semibold" style={{ color: '#1A2C45' }}>Notifications</p>
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllRead}
                className="text-xs hover:underline active:opacity-70"
                style={{ color: '#6B7280' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="text-xs text-center py-8" style={{ color: '#9CA3AF' }}>Loading…</p>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-1">🔕</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="w-full text-left px-4 py-3 border-b hover:opacity-80 active:opacity-60 transition-all flex gap-3 items-start"
                  style={{
                    borderColor: '#DCE8F7',
                    backgroundColor: n.read ? '#FFFFFF' : '#F4F7FB',
                  }}
                >
                  <span className="text-lg shrink-0 leading-none mt-0.5">
                    {TYPE_ICON[n.type] || '🔔'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-snug" style={{ color: '#1A2C45' }}>
                      {n.title}
                      {!n.read && (
                        <span
                          className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full align-middle"
                          style={{ backgroundColor: '#1565A7' }}
                        />
                      )}
                    </p>
                    {n.body && (
                      <p className="text-xs mt-0.5 leading-snug line-clamp-2" style={{ color: '#6B7280' }}>
                        {n.body}
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{timeAgo(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}