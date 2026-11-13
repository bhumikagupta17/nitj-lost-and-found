import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const INPUT = 'w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1565A7] placeholder-gray-400'
const INPUT_STYLE = { borderColor: '#DCE8F7', color: '#1A2C45' }

export default function Login() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '', password: '', name: '', roll_no: '', department: ''
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.email.endsWith('@nitj.ac.in')) {
      setError('Only @nitj.ac.in email addresses are allowed.')
      return
    }

    setLoading(true)

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            roll_no: form.roll_no,
            department: form.department,
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      alert('Account created! You can now sign in.')
      setIsSignUp(false)

    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      navigate('/')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F7FB' }}>

      {/* NITJ top bar */}
      <div className="hidden sm:flex items-center justify-between px-6 py-1.5 text-xs"
        style={{ backgroundColor: '#0D3B6E', color: '#93C6F0' }}>
        <span>Dr B.R. Ambedkar National Institute of Technology Jalandhar</span>
        <span>Institute of National Importance · Est. 1987</span>
      </div>

      {/* Blue header strip */}
      <div className="flex items-center gap-3 px-6 py-3" style={{ backgroundColor: '#1565A7' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-white/30"
          style={{ backgroundColor: '#0D3B6E' }}>
          <span className="text-base leading-none">🎓</span>
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">Lost &amp; Found Portal</p>
          <p className="text-[11px] leading-tight" style={{ color: '#93C6F0' }}>NITJ · Campus Services</p>
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* Card header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold" style={{ color: '#1A2C45', fontFamily: "'Lora','Georgia',serif" }}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#607D8B' }}>
              {isSignUp ? 'Register with your NITJ email to get started' : 'Access the NITJ Lost & Found Portal'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border p-6 sm:p-8 shadow-sm" style={{ borderColor: '#DCE8F7' }}>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">

              {isSignUp && (
                <>
                  <input
                    name="name" type="text" placeholder="Full Name"
                    value={form.name} onChange={handleChange} required
                    className={INPUT} style={INPUT_STYLE}
                  />
                  <input
                    name="roll_no" type="text" placeholder="Roll Number (e.g. 22103001)"
                    value={form.roll_no} onChange={handleChange}
                    className={INPUT} style={INPUT_STYLE}
                  />
                  <input
                    name="department" type="text" placeholder="Department (e.g. Computer Science)"
                    value={form.department} onChange={handleChange}
                    className={INPUT} style={INPUT_STYLE}
                  />
                  <div className="h-px" style={{ backgroundColor: '#DCE8F7' }} />
                </>
              )}

              <input
                name="email" type="email" placeholder="you@nitj.ac.in"
                value={form.email} onChange={handleChange} required
                className={INPUT} style={INPUT_STYLE}
              />
              <input
                name="password" type="password" placeholder="Password"
                value={form.password} onChange={handleChange} required
                className={INPUT} style={INPUT_STYLE}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-semibold py-3 rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 mt-1"
                style={{ backgroundColor: '#1565A7' }}
              >
                {loading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm mt-5" style={{ color: '#6B7280' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError('') }}
                className="font-semibold hover:underline active:opacity-70"
                style={{ color: '#1565A7' }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          <p className="text-center text-xs mt-4" style={{ color: '#9CA3AF' }}>
            Only @nitj.ac.in email addresses are allowed.
          </p>
        </div>
      </div>
    </div>
  )
}