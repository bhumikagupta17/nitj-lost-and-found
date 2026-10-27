import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const INPUT = 'w-full border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1C3829] placeholder-gray-400'

export default function ClaimForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [item, setItem] = useState(null)
  const [proof, setProof] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchItem() }, [id])

  async function fetchItem() {
    const { data, error: err } = await supabase
      .from('found_items')
      .select('id, title, category, location, description, status, reported_by')
      .eq('id', id).single()

    if (err || !data) { setError('Item not found.'); setLoading(false); return }
    if (data.reported_by === user?.id) { navigate(`/item/${id}`); return }
    if (data.status === 'closed' || data.status === 'escalated') { navigate(`/item/${id}`); return }

    setItem(data)
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (proof.trim().length < 20) {
      setError('Please write at least 20 characters describing the item. Be specific — colour, brand, what\'s inside, any marks.')
      return
    }

    setSubmitting(true)

    const { data: existing } = await supabase
      .from('claims').select('id')
      .eq('found_item_id', id).eq('claimant_id', user.id).maybeSingle()

    if (existing) {
      setError('You have already submitted a claim for this item.')
      setSubmitting(false)
      return
    }

    const { error: insertErr } = await supabase.from('claims').insert({
      found_item_id: id,
      claimant_id: user.id,
      description_proof: proof.trim(),
      status: 'pending',
    })

    if (insertErr) { setError(insertErr.message); setSubmitting(false); return }
    navigate(`/item/${id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading...</p>
      </div>
    )
  }

  if (error && !item) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="text-center">
          <p className="text-2xl mb-2">😕</p>
          <p className="text-sm" style={{ color: '#6B7280' }}>{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 text-sm hover:underline"
            style={{ color: '#1C3829' }}>← Back to home</button>
        </div>
      </div>
    )
  }

  const placeholder =
    item.category === 'Wallet / Purse'
      ? 'e.g. Brown leather wallet, has a torn corner on the left side. Inside: HDFC debit card, NITJ ID card, a small photo, and around ₹200 in cash.'
      : item.category === 'Mobile Phone'
      ? 'e.g. iPhone 13, black, has a clear case with a small crack at the bottom right. Lock screen wallpaper is a mountain photo. My name is written on the back of the case.'
      : item.category === 'Laptop / Tablet'
      ? "e.g. Dell Inspiron 15, silver, has a NITJ sticker on the lid. The charger cable is taped near the end. Password hint: it's my roll number."
      : "Describe the item in detail — colour, brand, markings, what's inside or attached, anything unique..."

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>

      {/* Header */}
      <div className="bg-white border-b px-6 py-4" style={{ borderColor: '#E8E2D8' }}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(`/item/${id}`)}
            className="text-sm hover:opacity-70 transition-opacity" style={{ color: '#6B7280' }}>
            ← Back to item
          </button>
          <span className="text-xs" style={{ color: '#9CA3AF' }}>Ownership Proof</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-4">

        {/* Item summary */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E8E2D8' }}>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: '#9CA3AF' }}>You are claiming</p>
          <h2 className="text-base font-bold" style={{ color: '#1C2B1E', fontFamily: "'Lora','Georgia',serif" }}>
            {item.title}
          </h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {[item.category, `📍 ${item.location}`].map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#F5F0E8', color: '#374151' }}>
                {tag}
              </span>
            ))}
          </div>
          {item.description && (
            <p className="text-sm mt-3 leading-relaxed" style={{ color: '#6B7280' }}>{item.description}</p>
          )}
        </div>

        {/* How it works */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#92400E' }}>📋 How this works</p>
          <ul className="space-y-1.5 text-xs" style={{ color: '#B45309' }}>
            <li>→ Describe the item from memory — colour, brand, what's inside, any unique marks</li>
            <li>→ The finder will read your description and decide if it matches</li>
            <li>→ If accepted, the photo is revealed and you can chat to arrange handover</li>
            <li>→ <strong>Do not guess.</strong> A detailed, accurate description is how you prove it's yours</li>
          </ul>
        </div>

        {/* Proof form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E8E2D8' }}>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#1C2B1E' }}>
              Describe the item to prove it's yours <span className="text-red-500">*</span>
            </label>
            <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>
              Include specific details only the real owner would know — colour, brand, model, what's stored inside, stickers, scratches, engravings, etc.
            </p>
            <textarea
              value={proof}
              onChange={e => setProof(e.target.value)}
              rows={6}
              placeholder={placeholder}
              className={`${INPUT} resize-none`}
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-xs" style={{
                color: proof.trim().length < 20 ? '#9CA3AF' : '#2D6A4F'
              }}>
                {proof.trim().length < 20
                  ? `${20 - proof.trim().length} more characters needed`
                  : '✓ Good length'}
              </span>
              <span className="text-xs" style={{ color: '#9CA3AF' }}>{proof.length} chars</span>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-2xl p-4 text-xs" style={{ backgroundColor: '#F5F0E8', color: '#6B7280' }}>
            ⚠️ False claims are a violation of NITJ rules. Only submit if this item genuinely belongs to you.
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl p-4 text-sm text-red-600 bg-red-50 border border-red-200">{error}</div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(`/item/${id}`)}
              className="flex-1 border py-3 rounded-xl text-sm hover:opacity-70 transition-opacity"
              style={{ borderColor: '#E8E2D8', color: '#6B7280' }}>
              Cancel
            </button>
            <button type="submit"
              disabled={submitting || proof.trim().length < 20}
              className="flex-1 text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: '#1C3829' }}>
              {submitting ? 'Submitting...' : 'Submit Claim →'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}