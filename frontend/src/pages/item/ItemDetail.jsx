import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [item, setItem] = useState(null)
  const [myClaim, setMyClaim] = useState(null)   // this user's claim on this item (if any)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isOwner = item?.reported_by === user?.id

  // Photo visible if: I'm the finder OR my claim was accepted
  const photoVisible = isOwner || myClaim?.status === 'accepted'

  useEffect(() => {
    fetchItem()
  }, [id])

  async function fetchItem() {
    setLoading(true)

    // Fetch item
    const { data: itemData, error: itemErr } = await supabase
      .from('found_items')
      .select('*, users(name, department)')
      .eq('id', id)
      .single()

    if (itemErr || !itemData) {
      setError('Item not found.')
      setLoading(false)
      return
    }
    setItem(itemData)

    // Fetch my claim on this item (if any)
    if (user) {
      const { data: claimData } = await supabase
        .from('claims')
        .select('*')
        .eq('found_item_id', id)
        .eq('claimant_id', user.id)
        .maybeSingle()

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
      active:    { bg: 'bg-green-100',  text: 'text-green-700',  label: '🟢 Active' },
      claimed:   { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏳ Claimed' },
      accepted:  { bg: 'bg-blue-100',   text: 'text-blue-700',   label: '✅ Accepted' },
      closed:    { bg: 'bg-gray-100',   text: 'text-gray-500',   label: '✔ Closed' },
      escalated: { bg: 'bg-red-100',    text: 'text-red-600',    label: '🚨 Escalated' },
    }
    const s = map[status] || map.active
    return (
      <span className={`${s.bg} ${s.text} text-xs px-2.5 py-1 rounded-full font-medium`}>
        {s.label}
      </span>
    )
  }

  // ── Loading / Error ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading item...</p>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-2">😕</p>
          <p className="text-gray-500 text-sm">{error || 'Item not found.'}</p>
          <button onClick={() => navigate('/')} className="mt-4 text-blue-600 text-sm hover:underline">
            ← Back to home
          </button>
        </div>
      </div>
    )
  }

  // ── Main UI ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            ← Back to listings
          </button>
          {statusBadge(item.status)}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

        {/* Photo section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {photoVisible ? (
            // Show the real photo
            item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full max-h-80 object-cover"
              />
            ) : (
              <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                No photo uploaded
              </div>
            )
          ) : (
            // Hidden — show blurred placeholder
            <div className="h-48 bg-gray-200 flex flex-col items-center justify-center gap-2">
              <span className="text-4xl">🔒</span>
              <p className="text-sm text-gray-500 font-medium">Photo hidden</p>
              <p className="text-xs text-gray-400 text-center px-6">
                {myClaim
                  ? 'Photo will be revealed once the finder accepts your claim.'
                  : 'Claim this item to reveal the photo after the finder verifies you.'}
              </p>
            </div>
          )}
        </div>

        {/* Item details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-bold text-gray-800">{item.title}</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              {item.category}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              📍 {item.location}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              🗓 {formatDate(item.created_at)}
            </span>
          </div>

          {item.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
          )}

          <p className="text-xs text-gray-400">
            Posted by {item.users?.name || 'a student'}
            {item.users?.department ? ` · ${item.users.department}` : ''}
          </p>
        </div>

        {/* ── Action area ── */}

        {/* I'm the finder — show incoming claims */}
        {isOwner && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">📬 You posted this item</p>
            <p className="text-xs text-blue-600">
              Go to your dashboard to review incoming claims and chat with claimers.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-3 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              View my dashboard →
            </button>
          </div>
        )}

        {/* Item is closed */}
        {!isOwner && item.status === 'closed' && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">This item has been returned to its owner. ✅</p>
          </div>
        )}

        {/* I have an accepted claim — show chat button */}
        {!isOwner && myClaim?.status === 'accepted' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-green-800 mb-1">✅ Your claim was accepted!</p>
            <p className="text-xs text-green-700 mb-3">
              The photo is now visible above. Chat with the finder to arrange handover.
            </p>
            <button
              onClick={() => navigate(`/chat/${myClaim.id}`)}
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Open chat →
            </button>
          </div>
        )}

        {/* I have a pending claim */}
        {!isOwner && myClaim?.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-yellow-800 mb-1">⏳ Claim submitted — waiting for finder</p>
            <p className="text-xs text-yellow-700">
              The finder will review your description and accept or reject your claim.
            </p>
          </div>
        )}

        {/* I have a rejected claim */}
        {!isOwner && myClaim?.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-700 mb-1">❌ Claim rejected</p>
            <p className="text-xs text-red-600">
              The finder didn't think your description matched. If this is truly yours, contact the NITJ security desk.
            </p>
          </div>
        )}

        {/* No claim yet + item is active — show claim button */}
        {!isOwner && !myClaim && item.status === 'active' && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-800 mb-1">Is this yours?</p>
            <p className="text-xs text-gray-500 mb-4">
              You'll need to describe the item from memory — colour, brand, what's inside, any marks.
              The finder will read your description before revealing the photo.
            </p>
            <button
              onClick={() => navigate(`/item/${id}/claim`)}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              This is mine — prove it →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}