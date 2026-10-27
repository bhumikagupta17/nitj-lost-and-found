import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const INPUT = 'w-full border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1C3829] placeholder-gray-400'

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
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#F5F0E8' }}>
      <div className="w-full max-w-md">

        {/* Logo mark */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl sm:text-2xl mb-3"
            style={{ backgroundColor: '#1C3829' }}
          >
            🏫
          </div>
          <h1
            className="text-lg sm:text-xl font-bold"
            style={{ color: '#1C3829', fontFamily: "'Lora', 'Georgia', serif" }}
          >
            NITJ Lost &amp; Found
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            {isSignUp ? 'Create your campus account' : 'Sign in to your account'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 sm:p-8 shadow-sm">

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
                  className={INPUT}
                />
                <input
                  name="roll_no" type="text" placeholder="Roll Number (e.g. 22103001)"
                  value={form.roll_no} onChange={handleChange}
                  className={INPUT}
                />
                <input
                  name="department" type="text" placeholder="Department (e.g. Computer Science)"
                  value={form.department} onChange={handleChange}
                  className={INPUT}
                />
              </>
            )}

            <input
              name="email" type="email" placeholder="you@nitj.ac.in"
              value={form.email} onChange={handleChange} required
              className={INPUT}
            />
            <input
              name="password" type="password" placeholder="Password"
              value={form.password} onChange={handleChange} required
              className={INPUT}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-3 rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 mt-2"
              style={{ backgroundColor: '#1C3829' }}
            >
              {loading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: '#6B7280' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError('') }}
              className="font-semibold hover:underline active:opacity-70"
              style={{ color: '#1C3829' }}
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
  )
}