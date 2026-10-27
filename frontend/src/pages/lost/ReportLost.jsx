import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { CATEGORIES, LOCATIONS } from '../../lib/constants'

const INPUT = 'w-full rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 placeholder-gray-400'
const INPUT_STYLE = { border: '1px solid #E8E2D8', color: '#1C2B1E', outlineColor: '#1C3829' }

export default function ReportLost() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', category: '',
    category_other: '', location: '', location_other: '',
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.category) { setError('Please select a category.'); return }
    if (!form.location) { setError('Please select a location.'); return }
    setLoading(true)
    const { error: insertError } = await supabase.from('lost_items').insert({
      title: form.title,
      description: form.description,
      category: form.category === 'Other' ? form.category_other : form.category,
      location: form.location === 'Other' ? form.location_other : form.location,
      status: 'active',
      reported_by: user.id,
    })
    if (insertError) { setError(insertError.message); setLoading(false); return }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-start justify-center pt-10 px-4"
      style={{ backgroundColor: '#F5F0E8' }}>
      <div className="w-full max-w-lg">

        {/* Back */}
        <button onClick={() => navigate('/')}
          className="text-sm mb-4 flex items-center gap-1 hover:underline"
          style={{ color: '#6B7280' }}>
          ← Back to home
        </button>

        <div className="bg-white rounded-2xl p-8"
          style={{ border: '1px solid #E8E2D8', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

          <div className="mb-6">
            <h1 className="text-xl font-bold"
              style={{ color: '#1C2B1E', fontFamily: "'Lora','Georgia',serif" }}>
              Report Lost Item
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              Describe what you lost and where you last had it.
            </p>
          </div>

          {error && (
            <div className="text-sm px-4 py-3 rounded-xl mb-4"
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C2B1E' }}>
                Item Title <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input name="title" type="text" placeholder="e.g. Blue JBL earphones"
                value={form.title} onChange={handleChange} required
                className={INPUT} style={INPUT_STYLE} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C2B1E' }}>
                Category <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <select name="category" value={form.category} onChange={handleChange}
                className={INPUT} style={INPUT_STYLE}>
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {form.category === 'Other' && (
                <input name="category_other" type="text" placeholder="Describe the item type…"
                  value={form.category_other} onChange={handleChange}
                  className={`${INPUT} mt-2`} style={INPUT_STYLE} />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C2B1E' }}>
                Where did you last have it? <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <select name="location" value={form.location} onChange={handleChange}
                className={INPUT} style={INPUT_STYLE}>
                <option value="">Select a location</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {form.location === 'Other' && (
                <input name="location_other" type="text" placeholder="Describe the location…"
                  value={form.location_other} onChange={handleChange}
                  className={`${INPUT} mt-2`} style={INPUT_STYLE} />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C2B1E' }}>
                Description{' '}
                <span className="text-sm font-normal" style={{ color: '#9CA3AF' }}>(optional)</span>
              </label>
              <textarea name="description"
                placeholder="Colour, brand, any identifying features…"
                value={form.description} onChange={handleChange} rows={3}
                className={`${INPUT} resize-none`} style={INPUT_STYLE} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate('/')}
                className="flex-1 py-2.5 rounded-xl text-sm transition-colors hover:opacity-80"
                style={{ border: '1px solid #E8E2D8', color: '#6B7280', backgroundColor: '#FFFFFF' }}>
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#1C3829' }}>
                {loading ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}