import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [item, setItem] = useState(null)
  const [myClaim, setMyClaim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isOwner = item?.reported_by === user?.id
  const photoVisible = isOwner || myClaim?.status === 'accepted'

  useEffect(() => { fetchItem() }, [id])

  async function fetchItem() {
    setLoading(true)
    const { data: itemData, error: itemErr } = await supabase
      .from('found_items').select('*').eq('id', id).single()

    if (itemErr || !itemData) {
      setError('Item not found.')
      setLoading(false)
      return
    }

    const { data: posterData } = await supabase
      .from('users').select('name, department').eq('id', itemData.reported_by).maybeSingle()

    setItem({ ...itemData, users: posterData || null })

    if (user) {
      const { data: claimData } = await supabase
        .from('claims').select('*')
        .eq('found_item_id', id).eq('claimant_id', user.id).maybeSingle()
      setMyClaim(claimData || null)
    }
    setLoading(false)
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  function statusBadge(status) {
    const map = {
      active:    { bg: '#ECFDF5', color: '#059669', label: '🟢 Active' },
      claimed:   { bg: '#FFFBEB', color: '#D97706', label: '⏳ Claimed' },
      accepted:  { bg: '#EEF9F4', color: '#2D6A4F', label: '✅ Accepted' },
      closed:    { bg: '#F3F4F6', color: '#6B7280', label: '✔ Closed' },
      escalated: { bg: '#FEF2F2', color: '#DC2626', label: '🚨 Escalated' },
    }
    const s = map[status] || map.active
    return (
      <span
        className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
        style={{ backgroundColor: s.bg, color: s.color }}
      >
        {s.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading item...</p>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="text-center px-6">
          <p className="text-2xl mb-2">😕</p>
          <p className="text-sm" style={{ color: '#6B7280' }}>{error || 'Item not found.'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-sm hover:underline active:opacity-70"
            style={{ color: '#1C3829' }}
          >
            ← Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>

      {/* Header */}
      <div className="bg-white border-b" style={{ borderColor: '#E8E2D8' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-sm hover:opacity-70 transition-opacity active:opacity-50 shrink-0"
            style={{ color: '#6B7280' }}
          >
            ← Back
          </button>
          {statusBadge(item.status)}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-3 sm:space-y-4">

        {/* Photo */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E8E2D8' }}>
          {photoVisible ? (
            item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full max-h-56 sm:max-h-80 object-cover"
              />
            ) : (
              <div
                className="h-36 sm:h-48 flex items-center justify-center text-sm"
                style={{ backgroundColor: '#F5F0E8', color: '#9CA3AF' }}
              >
                No photo uploaded
              </div>
            )
          ) : (
            <div
              className="h-36 sm:h-48 flex flex-col items-center justify-center gap-2"
              style={{ backgroundColor: '#F5F0E8' }}
            >
              <span className="text-3xl sm:text-4xl">🔒</span>
              <p className="text-sm font-medium" style={{ color: '#374151' }}>Photo hidden</p>
              <p className="text-xs text-center px-6" style={{ color: '#9CA3AF' }}>
                {myClaim
                  ? 'Photo will be revealed once the finder accepts your claim.'
                  : 'Claim this item to reveal the photo after the finder verifies you.'}
              </p>
            </div>
          )}
        </div>

        {/* Item details */}
        <div className="bg-white rounded-2xl border p-4 sm:p-5 space-y-3" style={{ borderColor: '#E8E2D8' }}>
          <h1
            className="text-base sm:text-lg font-bold leading-snug"
            style={{ color: '#1C2B1E', fontFamily: "'Lora','Georgia',serif" }}
          >
            {item.title}
          </h1>

          <div className="flex flex-wrap gap-2">
            {[item.category, `📍 ${item.location}`, `🗓 ${formatDate(item.created_at)}`].map(tag => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#F5F0E8', color: '#374151' }}
              >
                {tag}
              </span>
            ))}
          </div>

          {item.description && (
            <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{item.description}</p>
          )}

          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            Posted by {item.users?.name || 'a student'}
            {item.users?.department ? ` · ${item.users.department}` : ''}
          </p>
        </div>

        {/* Owner view */}
        {isOwner && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#EEF9F4', border: '1px solid #B7DFC9' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#1C3829' }}>📬 You posted this item</p>
            <p className="text-xs mb-3" style={{ color: '#2D6A4F' }}>
              Go to your dashboard to review incoming claims and chat with claimers.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-white px-4 py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all"
              style={{ backgroundColor: '#1C3829' }}
            >
              View my dashboard →
            </button>
          </div>
        )}

        {/* Item closed */}
        {!isOwner && item.status === 'closed' && (
          <div className="rounded-2xl p-4 text-center bg-white border" style={{ borderColor: '#E8E2D8' }}>
            <p className="text-sm" style={{ color: '#6B7280' }}>This item has been returned to its owner. ✅</p>
          </div>
        )}

        {/* Accepted claim */}
        {!isOwner && myClaim?.status === 'accepted' && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#EEF9F4', border: '1px solid #B7DFC9' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#1C3829' }}>✅ Your claim was accepted!</p>
            <p className="text-xs mb-3" style={{ color: '#2D6A4F' }}>
              The photo is now visible above. Chat with the finder to arrange handover.
            </p>
            <button
              onClick={() => navigate(`/chat/${myClaim.id}`)}
              className="text-sm text-white px-4 py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all"
              style={{ backgroundColor: '#2D6A4F' }}
            >
              Open chat →
            </button>
          </div>
        )}

        {/* Pending claim */}
        {!isOwner && myClaim?.status === 'pending' && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#92400E' }}>⏳ Claim submitted — waiting for finder</p>
            <p className="text-xs" style={{ color: '#B45309' }}>
              The finder will review your description and accept or reject your claim.
            </p>
          </div>
        )}

        {/* Rejected claim */}
        {!isOwner && myClaim?.status === 'rejected' && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#DC2626' }}>❌ Claim rejected</p>
            <p className="text-xs" style={{ color: '#B91C1C' }}>
              The finder didn't think your description matched. If this is truly yours, contact the NITJ security desk.
            </p>
          </div>
        )}

        {/* Claim CTA */}
        {!isOwner && !myClaim && item.status === 'active' && (
          <div className="bg-white rounded-2xl border p-4 sm:p-5" style={{ borderColor: '#E8E2D8' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#1C2B1E' }}>Is this yours?</p>
            <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
              You'll need to describe the item from memory — colour, brand, what's inside, any marks.
              The finder will read your description before revealing the photo.
            </p>
            <button
              onClick={() => navigate(`/item/${id}/claim`)}
              className="w-full text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all text-sm sm:text-base"
              style={{ backgroundColor: '#1C3829' }}
            >
              This is mine — prove it →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}