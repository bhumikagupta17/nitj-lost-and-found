import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [item, setItem]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [interest, setInterest]   = useState(null)
  const [flagging, setFlagging]   = useState(false)
  const [note, setNote]           = useState('')
  const [showNoteBox, setShowNoteBox] = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  const isSecurityOrAdmin = profile?.role === 'security' || profile?.role === 'admin'

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('found_items')
        .select('id, title, category, description, location, status, created_at, image_url')
        .eq('id', id)
        .single()

      if (err || !data) { setError('Item not found.'); setLoading(false); return }
      setItem(data)

      if (user) {
        const { data: existing } = await supabase
          .from('interests')
          .select('*')
          .eq('item_id', id)
          .eq('user_id', user.id)
          .maybeSingle()
        setInterest(existing || null)
      }

      setLoading(false)
    }
    fetch()
  }, [id, user])

  async function handleFlag() {
    if (!user) { navigate('/login'); return }
    if (interest) return
    setFlagging(true)
    setError('')

    const { data, error: err } = await supabase
      .from('interests')
      .insert({ item_id: id, user_id: user.id, note: note.trim() || null })
      .select().single()

    if (err) { setError('Could not submit. Try again.'); setFlagging(false); return }
    setInterest(data)
    setShowNoteBox(false)
    setSuccess('Your flag has been submitted. The Security Desk will review it and contact you if it matches.')
    setFlagging(false)
  }

  async function handleRemoveFlag() {
    if (!interest) return
    setFlagging(true)
    await supabase.from('interests').delete().eq('id', interest.id)
    setInterest(null)
    setSuccess('')
    setFlagging(false)
  }

  const statusBadge = {
    active:     { label: 'Active',               bg: '#EAF4FF', color: '#1565A7' },
    in_custody: { label: '📦 At Security Desk',  bg: '#EAF4FF', color: '#1565A7' },
    escalated:  { label: '⚠️ Escalated',          bg: '#FFF7ED', color: '#C2410C' },
    closed:     { label: '✅ Returned',           bg: '#F0FDF4', color: '#166534' },
  }[item?.status] || { label: item?.status, bg: '#F4F7FB', color: '#374151' }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F7FB' }}>
      <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading…</p>
    </div>
  )

  if (error && !item) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F7FB' }}>
      <div className="text-center px-6">
        <p className="text-3xl mb-2">😕</p>
        <p className="text-sm mb-4" style={{ color: '#6B7280' }}>{error}</p>
        <button onClick={() => navigate('/')} className="text-sm hover:underline" style={{ color: '#1565A7' }}>← Home</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F7FB' }}>

      {/* Header */}
      <div className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4" style={{ borderColor: '#DCE8F7' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button onClick={() => navigate(-1)} className="text-sm hover:opacity-70 active:scale-95 transition-all"
            style={{ color: '#6B7280' }}>← Back</button>
          <span className="text-xs px-3 py-1 rounded-full font-medium"
            style={{ backgroundColor: statusBadge.bg, color: statusBadge.color }}>
            {statusBadge.label}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Photo */}
        {item.image_url && (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #DCE8F7' }}>
            <img src={item.image_url} alt={item.title}
              className="w-full object-cover max-h-72" />
          </div>
        )}

        {/* Main info */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#DCE8F7' }}>
          <span className="text-xs px-2 py-0.5 rounded-full mb-3 inline-block"
            style={{ backgroundColor: '#EAF4FF', color: '#1565A7' }}>{item.category}</span>
          <h1 className="text-lg font-bold mb-2" style={{ color: '#1A2C45', fontFamily: "'Lora','Georgia',serif" }}>
            {item.title}
          </h1>
          {item.description && (
            <p className="text-sm mb-4 leading-relaxed" style={{ color: '#6B7280' }}>{item.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: '#9CA3AF' }}>
            <span>📍 {item.location}</span>
            <span>📅 Found {formatDate(item.created_at)}</span>
          </div>
        </div>

        {/* HOW TO COLLECT */}
        <div className="rounded-2xl px-4 py-4 text-sm"
          style={{ backgroundColor: '#EAF4FF', border: '1px solid #93C6F0', color: '#1565A7' }}>
          <p className="font-semibold mb-1">📦 How to collect this item</p>
          <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>
            {item.status === 'in_custody'
              ? 'This item is currently at the Security Desk. Visit with your ID and describe the item to verify ownership. The security guard will hand it over.'
              : "Once the Security Guard collects this item, it will be available at the Security Desk. You'll be notified if your lost report matches this item."
            }
          </p>
        </div>

        {/* INTEREST FLAG */}
        {user && !isSecurityOrAdmin && item.status !== 'closed' && (
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#DCE8F7' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#1A2C45' }}>
              🙋 Think this is yours?
            </p>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: '#6B7280' }}>
              Flag it and the Security Guard will review. <strong>Do not contact the finder directly</strong> —
              all handovers go through the Security Desk.
            </p>

            {success && (
              <div className="rounded-xl px-4 py-3 mb-3 text-xs"
                style={{ backgroundColor: '#EAF4FF', border: '1px solid #93C6F0', color: '#1565A7' }}>
                {success}
              </div>
            )}

            {error && (
              <div className="rounded-xl px-4 py-3 mb-3 text-xs"
                style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626' }}>
                {error}
              </div>
            )}

            {interest ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs" style={{ color: '#1565A7' }}>✅ You've flagged this item. Security will review.</span>
                <button onClick={handleRemoveFlag} disabled={flagging}
                  className="text-xs hover:underline disabled:opacity-50 shrink-0"
                  style={{ color: '#9CA3AF' }}>
                  Remove flag
                </button>
              </div>
            ) : showNoteBox ? (
              <div className="space-y-3">
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Describe why this is yours — serial number, contents, marks, etc. (optional but helps security verify faster)"
                  rows={3}
                  className="w-full rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1565A7] resize-none"
                  style={{ border: '1.5px solid #DCE8F7', color: '#1A2C45' }}
                  maxLength={300}
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowNoteBox(false)}
                    className="flex-1 text-xs py-2 rounded-xl border hover:opacity-70 active:scale-95 transition-all"
                    style={{ borderColor: '#DCE8F7', color: '#374151' }}>
                    Cancel
                  </button>
                  <button onClick={handleFlag} disabled={flagging}
                    className="flex-1 text-xs text-white py-2 rounded-xl hover:opacity-90 disabled:opacity-50 font-medium active:scale-95 transition-all"
                    style={{ backgroundColor: '#1565A7' }}>
                    {flagging ? '…' : 'Submit Flag'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowNoteBox(true)}
                className="w-full text-xs text-white py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all font-medium"
                style={{ backgroundColor: '#1565A7' }}>
                🙋 This is Mine — Flag for Security
              </button>
            )}
          </div>
        )}

        {/* Not logged in */}
        {!user && (
          <div className="bg-white rounded-2xl border p-5 text-center" style={{ borderColor: '#DCE8F7' }}>
            <p className="text-sm mb-3" style={{ color: '#6B7280' }}>Log in to flag this item as yours.</p>
            <button onClick={() => navigate('/login')}
              className="text-sm text-white px-5 py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all"
              style={{ backgroundColor: '#1565A7' }}>
              Log in
            </button>
          </div>
        )}

      </div>
    </div>
  )
}