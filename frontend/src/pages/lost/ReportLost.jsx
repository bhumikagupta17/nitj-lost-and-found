import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const CATEGORIES = [
  'Electronics', 'Bag / Backpack', 'Wallet / Purse', 'ID / Card',
  'Keys', 'Books / Notes', 'Clothing', 'Jewellery', 'Stationery', 'Other',
]

export default function ReportLost() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    last_seen_location: '',
    lost_date: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.category) {
      setError('Please fill in the item name and category.')
      return
    }
    setSubmitting(true)
    setError('')

    const { error: err } = await supabase.from('lost_reports').insert({
      user_id:            user.id,
      title:              form.title.trim(),
      category:           form.category,
      description:        form.description.trim() || null,
      last_seen_location: form.last_seen_location.trim() || null,
      lost_date:          form.lost_date || null,
    })

    if (err) {
      setError(err.message)
      setSubmitting(false)
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F7FB' }}>

      {/* Header */}
      <div className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4" style={{ borderColor: '#DCE8F7' }}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-bold" style={{ color: '#1A2C45', fontFamily: "'Lora','Georgia',serif" }}>
              😟 Report a Lost Item
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              We'll notify you if a matching item is found and handed to security.
            </p>
          </div>
          <button onClick={() => navigate(-1)} className="text-sm hover:opacity-70 active:scale-95 transition-all"
            style={{ color: '#6B7280' }}>← Back</button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">

        {/* Info banner */}
        <div className="rounded-2xl px-4 py-3 mb-6 text-xs"
          style={{ backgroundColor: '#EAF4FF', border: '1px solid #93C6F0', color: '#1976D2' }}>
          <strong>How it works:</strong> File your report below. If a matching found item is registered and collected by security,
          you'll get a notification to visit the Security Desk with your ID to collect it.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Item name */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
              What did you lose? <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Black OnePlus phone, Blue Jansport bag"
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565A7]"
              style={{ border: '1.5px solid #DCE8F7', color: '#1A2C45', backgroundColor: '#fff' }}
              maxLength={120}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
              Category <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => set('category', cat)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all active:scale-95"
                  style={form.category === cat
                    ? { backgroundColor: '#1565A7', color: '#fff', borderColor: '#1565A7' }
                    : { backgroundColor: '#fff', color: '#374151', borderColor: '#DCE8F7' }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
              Description <span className="font-normal" style={{ color: '#9CA3AF' }}>(optional — the more detail, the better)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Colour, brand, distinguishing marks, what was inside, etc."
              rows={3}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565A7] resize-none"
              style={{ border: '1.5px solid #DCE8F7', color: '#1A2C45', backgroundColor: '#fff' }}
              maxLength={500}
            />
          </div>

          {/* Last seen location */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
              Where did you last have it? <span className="font-normal" style={{ color: '#9CA3AF' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={form.last_seen_location}
              onChange={e => set('last_seen_location', e.target.value)}
              placeholder="e.g. Library, Block 3 classroom, Canteen"
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565A7]"
              style={{ border: '1.5px solid #DCE8F7', color: '#1A2C45', backgroundColor: '#fff' }}
              maxLength={120}
            />
          </div>

          {/* Date lost */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
              Date lost <span className="font-normal" style={{ color: '#9CA3AF' }}>(optional)</span>
            </label>
            <input
              type="date"
              value={form.lost_date}
              onChange={e => set('lost_date', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565A7]"
              style={{ border: '1.5px solid #DCE8F7', color: '#1A2C45', backgroundColor: '#fff' }}
            />
          </div>

          {/* Privacy note */}
          <div className="rounded-xl px-4 py-3 text-xs"
            style={{ backgroundColor: '#F4F7FB', border: '1px solid #DCE8F7', color: '#6B7280' }}>
            📋 Your name and department will be visible on the portal so security can verify and contact you if needed.
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-xs"
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all text-sm"
            style={{ backgroundColor: '#1565A7' }}
          >
            {submitting ? 'Submitting…' : 'Submit Lost Report'}
          </button>

        </form>
      </div>
    </div>
  )
}