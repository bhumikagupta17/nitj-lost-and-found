import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { LOCATIONS, CATEGORIES } from '../../lib/constants'

const INPUT = 'w-full rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none placeholder-gray-400'
const INPUT_STYLE = { border: '1px solid #E8E2D8', color: '#1C2B1E' }

export default function ReportFound() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState({
    title: '', category: '', customCategory: '',
    location: '', customLocation: '', description: '',
  })
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5 MB.'); return }
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  function removePhoto() { setPhoto(null); setPreview(null) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const finalCategory = form.category === 'Other' ? form.customCategory : form.category
    const finalLocation = form.location === 'Other' ? form.customLocation : form.location
    if (!form.title.trim())       return setError('Please enter an item title.')
    if (!finalCategory)           return setError('Please select a category.')
    if (!finalLocation)           return setError('Please select where you found it.')
    if (!form.description.trim()) return setError('Please describe the item.')
    if (!photo)                   return setError('Please upload a photo — it helps verify ownership.')
    setLoading(true)
    try {
      const ext = photo.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('found-items').upload(filePath, photo, { cacheControl: '3600', upsert: false })
      if (uploadError) throw new Error('Photo upload failed: ' + uploadError.message)
      const { data: urlData } = supabase.storage.from('found-items').getPublicUrl(filePath)
      const { error: insertError } = await supabase.from('found_items').insert({
        title: form.title.trim(), category: finalCategory, location: finalLocation,
        description: form.description.trim(), image_url: urlData.publicUrl,
        reported_by: user.id, status: 'active',
      })
      if (insertError) throw new Error(insertError.message)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>

      {/* Header */}
      <div className="bg-white border-b" style={{ borderColor: '#E8E2D8' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-lg sm:text-xl font-bold leading-snug"
              style={{ color: '#1C2B1E', fontFamily: "'Lora','Georgia',serif" }}
            >
              Report a Found Item
            </h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#6B7280' }}>
              Found something on campus? Post it so the owner can claim it.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="shrink-0 text-sm border px-3 py-1.5 rounded-xl hover:opacity-70 active:scale-95 transition-all"
            style={{ borderColor: '#E8E2D8', color: '#6B7280' }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">

          {/* Photo upload */}
          <div className="bg-white rounded-2xl p-4 sm:p-5" style={{ border: '1px solid #E8E2D8' }}>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#1C2B1E' }}>
              📷 Photo <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>
              Required. Photo stays hidden until you accept a claim — it's used to verify ownership.
            </p>
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-52 sm:max-h-56 object-cover rounded-xl"
                  style={{ border: '1px solid #E8E2D8' }}
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow text-xs font-bold hover:opacity-70 active:scale-95 transition-all"
                  style={{ border: '1px solid #E8E2D8', color: '#6B7280' }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-8 sm:py-10 cursor-pointer transition-colors"
                style={{ borderColor: '#D1C9BB', backgroundColor: '#FDFCFA' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2D6A4F'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#D1C9BB'}
              >
                <span className="text-3xl mb-2">📸</span>
                <span className="text-sm" style={{ color: '#6B7280' }}>Tap to upload a photo</span>
                <span className="text-xs mt-1" style={{ color: '#9CA3AF' }}>JPG, PNG, WEBP — max 5 MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            )}
          </div>

          {/* Item title */}
          <div className="bg-white rounded-2xl p-4 sm:p-5" style={{ border: '1px solid #E8E2D8' }}>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C2B1E' }}>
              Item Title <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Blue water bottle, Black wallet, iPhone 14"
              className={INPUT}
              style={INPUT_STYLE}
            />
          </div>

          {/* Category */}
          <div className="bg-white rounded-2xl p-4 sm:p-5" style={{ border: '1px solid #E8E2D8' }}>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C2B1E' }}>
              Category <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={INPUT}
              style={INPUT_STYLE}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {form.category === 'Other' && (
              <input
                type="text"
                name="customCategory"
                value={form.customCategory}
                onChange={handleChange}
                placeholder="Describe the category"
                className={`${INPUT} mt-2`}
                style={INPUT_STYLE}
              />
            )}
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl p-4 sm:p-5" style={{ border: '1px solid #E8E2D8' }}>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C2B1E' }}>
              Where did you find it? <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <select
              name="location"
              value={form.location}
              onChange={handleChange}
              className={INPUT}
              style={INPUT_STYLE}
            >
              <option value="">Select a location</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {form.location === 'Other' && (
              <input
                type="text"
                name="customLocation"
                value={form.customLocation}
                onChange={handleChange}
                placeholder="Describe the location"
                className={`${INPUT} mt-2`}
                style={INPUT_STYLE}
              />
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-4 sm:p-5" style={{ border: '1px solid #E8E2D8' }}>
            <label className="block text-sm font-semibold mb-1" style={{ color: '#1C2B1E' }}>
              Description <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>
              Describe what you see — don't mention unique details. Leave those for the claimer to prove.
            </p>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="e.g. Found near the library entrance. Black backpack with multiple pockets."
              className={`${INPUT} resize-none`}
              style={INPUT_STYLE}
            />
          </div>

          {/* Info box */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#EEF9F4', border: '1px solid #B7DFC9' }}>
            <p className="text-sm font-semibold mb-1.5" style={{ color: '#1C3829' }}>
              🔒 How ownership verification works:
            </p>
            <ol className="space-y-1" style={{ listStyleType: 'decimal', paddingLeft: '1.2rem' }}>
              {[
                'Your photo stays hidden — claimers cannot see it',
                'A claimer must describe the item from memory to prove ownership',
                'You read their description and decide to accept or reject',
                'Only after you accept does the claimer see the photo & get your contact',
              ].map((line, i) => (
                <li key={i} className="text-xs" style={{ color: '#2D6A4F' }}>{line}</li>
              ))}
            </ol>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-2xl p-4 text-sm"
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all text-sm sm:text-base"
            style={{ backgroundColor: '#1C3829' }}
          >
            {loading ? 'Uploading & posting…' : 'Post Found Item →'}
          </button>

        </form>
      </div>
    </div>
  )
}