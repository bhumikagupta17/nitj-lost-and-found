import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { LOCATIONS, CATEGORIES } from '../../lib/constants'

export default function ReportFound() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState({
    title: '',
    category: '',
    customCategory: '',
    location: '',
    customLocation: '',
    description: '',
  })
  const [photo, setPhoto] = useState(null)         // File object
  const [preview, setPreview] = useState(null)     // URL for <img> preview
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── form field changes ──────────────────────────────────────────
  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // ── photo picked from file input ────────────────────────────────
  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5 MB.')
      return
    }
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  function removePhoto() {
    setPhoto(null)
    setPreview(null)
  }

  // ── submit ──────────────────────────────────────────────────────
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
      // 1. Upload photo to Supabase Storage
      const ext = photo.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('found-items')
        .upload(filePath, photo, { cacheControl: '3600', upsert: false })

      if (uploadError) throw new Error('Photo upload failed: ' + uploadError.message)

      // 2. Get the public URL
      const { data: urlData } = supabase.storage
        .from('found-items')
        .getPublicUrl(filePath)

      const image_url = urlData.publicUrl

      // 3. Insert found item
      const { error: insertError } = await supabase
        .from('found_items')
        .insert({
          title: form.title.trim(),
          category: finalCategory,
          location: finalLocation,
          description: form.description.trim(),
          image_url,
          reported_by: user.id,
          status: 'active',
        })

      if (insertError) throw new Error(insertError.message)

      navigate('/dashboard')

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── UI ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Report a Found Item</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Found something on campus? Post it here so the owner can claim it.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-300 px-3 py-1.5 rounded-lg"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Photo upload — first, most prominent */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              📷 Photo <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Required. Photo stays hidden from everyone until you accept a claim — it's used to verify ownership.
            </p>

            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-56 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 bg-white text-gray-600 hover:text-red-500 rounded-full w-7 h-7 flex items-center justify-center shadow border border-gray-200 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-10 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <span className="text-3xl mb-2">📸</span>
                <span className="text-sm text-gray-500">Click to upload a photo</span>
                <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — max 5 MB</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhoto}
                />
              </label>
            )}
          </div>

          {/* Item title */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Item Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Blue water bottle, Black wallet, iPhone 14"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Where did you find it? <span className="text-red-500">*</span>
            </label>
            <select
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Describe what you see — but don't mention unique identifying details. Leave those for the claimer to prove.
            </p>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="e.g. Found near the library entrance. Black backpack with multiple pockets."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">🔒 How ownership verification works:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-blue-600">
              <li>Your photo stays hidden — claimers cannot see it</li>
              <li>A claimer must describe the item from memory to prove ownership</li>
              <li>You read their description and decide to accept or reject</li>
              <li>Only after you accept does the claimer see the photo</li>
            </ol>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Uploading & posting...' : 'Post Found Item →'}
          </button>

        </form>
      </div>
    </div>
  )
}