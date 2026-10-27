import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function ClaimForm() {
  const { id } = useParams()           // found_item id
  const navigate = useNavigate()
  const { user } = useAuth()

  const [item, setItem] = useState(null)
  const [proof, setProof] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchItem()
  }, [id])

  async function fetchItem() {
    const { data, error: err } = await supabase
      .from('found_items')
      .select('id, title, category, location, description, status, reported_by')
      .eq('id', id)
      .single()

    if (err || !data) {
      setError('Item not found.')
      setLoading(false)
      return
    }

    // Can't claim your own item
    if (data.reported_by === user?.id) {
      navigate(`/item/${id}`)
      return
    }

    // Can't claim a closed/escalated item
    if (data.status === 'closed' || data.status === 'escalated') {
      navigate(`/item/${id}`)
      return
    }

    setItem(data)
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (proof.trim().length < 20) {
      setError("Please write at least 20 characters describing the item. Be specific — colour, brand, what's inside, any marks.")
      return
    }

    setSubmitting(true)

    // Check if already claimed by this user
    const { data: existing } = await supabase
      .from('claims')
      .select('id')
      .eq('found_item_id', id)
      .eq('claimant_id', user.id)
      .maybeSingle()

    if (existing) {
      setError('You have already submitted a claim for this item.')
      setSubmitting(false)
      return
    }

    // Insert the claim
    const { error: insertErr } = await supabase
      .from('claims')
      .insert({
        found_item_id: id,
        claimant_id: user.id,
        description_proof: proof.trim(),
        status: 'pending',
      })

    if (insertErr) {
      setError(insertErr.message)
      setSubmitting(false)
      return
    }

    // Navigate back to item page — it will now show "pending" state
    navigate(`/item/${id}`)
  }

  // ── Loading / Error ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  if (error && !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-2">😕</p>
          <p className="text-gray-500 text-sm">{error}</p>
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
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(`/item/${id}`)}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            ← Back to item
          </button>
          <span className="text-xs text-gray-400">Ownership Proof</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-5">

        {/* Item summary — what they're claiming */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">You are claiming</p>
          <h2 className="text-base font-bold text-gray-800">{item.title}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
              {item.category}
            </span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
              📍 {item.location}
            </span>
          </div>
          {item.description && (
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">{item.description}</p>
          )}
        </div>

        {/* How it works */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">📋 How this works</p>
          <ul className="text-xs text-amber-700 space-y-1.5">
            <li>→ Describe the item from memory — colour, brand, what's inside, any unique marks</li>
            <li>→ The finder will read your description and decide if it matches</li>
            <li>→ If accepted, the photo is revealed to you and you can chat to arrange handover</li>
            <li>→ <strong>Do not guess.</strong> A detailed, accurate description is how you prove it's yours</li>
          </ul>
        </div>

        {/* Proof textarea */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Describe the item to prove it's yours <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Include specific details only the real owner would know — colour, brand, model, what's stored inside, stickers, scratches, engravings, etc.
            </p>
            <textarea
              value={proof}
              onChange={e => setProof(e.target.value)}
              rows={6}
              placeholder={
                item.category === 'Wallet / Purse'
                  ? 'e.g. Brown leather wallet, has a torn corner on the left side. Inside: HDFC debit card, NITJ ID card, a small photo, and around ₹200 in cash.'
                  : item.category === 'Mobile Phone'
                  ? 'e.g. iPhone 13, black, has a clear case with a small crack at the bottom right. Lock screen wallpaper is a mountain photo. My name is written on the back of the case.'
                  : item.category === 'Laptop / Tablet'
                  ? 'e.g. Dell Inspiron 15, silver, has a NITJ sticker on the lid. The charger cable is taped near the end. Password hint: it\'s my roll number.'
                  : 'Describe the item in detail — colour, brand, markings, what\'s inside or attached, anything unique...'
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {/* Character counter */}
            <div className="flex justify-between mt-1.5">
              <span className={`text-xs ${proof.trim().length < 20 ? 'text-gray-400' : 'text-green-600'}`}>
                {proof.trim().length < 20
                  ? `${20 - proof.trim().length} more characters needed`
                  : '✓ Good length'}
              </span>
              <span className="text-xs text-gray-400">{proof.length} chars</span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500">
            ⚠️ False claims are a violation of NITJ rules. Only submit if this item genuinely belongs to you.
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(`/item/${id}`)}
              className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || proof.trim().length < 20}
              className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Claim →'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}