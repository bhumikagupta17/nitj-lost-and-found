import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function ChatWindow() {
  const { claimId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [claim, setClaim] = useState(null)
  const [item, setItem] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState('')

  const bottomRef = useRef(null)

  useEffect(() => {
    if (user) fetchAll()
  }, [claimId, user])

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${claimId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `claim_id=eq.${claimId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [claimId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchAll() {
    setLoading(true)

    const { data: claimData, error: claimErr } = await supabase
      .from('claims')
      .select('*, found_items(*)')
      .eq('id', claimId)
      .single()

    if (claimErr || !claimData) {
      console.error('claim fetch error:', claimErr)
      setError('Chat not found.')
      setLoading(false)
      return
    }

    const foundItem = claimData.found_items
    const isFinder = foundItem?.reported_by === user?.id
    const isClaimer = claimData.claimant_id === user?.id

    if (!isFinder && !isClaimer) { navigate('/'); return }
    if (claimData.status !== 'accepted') { navigate(`/item/${foundItem?.id}`); return }

    setClaim(claimData)
    setItem(foundItem)

    const { data: msgData } = await supabase
      .from('messages')
      .select('*')
      .eq('claim_id', claimId)
      .order('created_at', { ascending: true })

    setMessages(msgData || [])
    setLoading(false)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim()) return
    setSending(true)
    const { error: sendErr } = await supabase.from('messages').insert({
      claim_id: claimId, sender_id: user.id, content: newMessage.trim(),
    })
    if (sendErr) setError('Failed to send message.')
    else setNewMessage('')
    setSending(false)
  }

  async function handleHandover() {
    if (!window.confirm('Mark this item as handed over? This will close the listing.')) return
    setClosing(true)
    await supabase.from('found_items').update({ status: 'closed' }).eq('id', item.id)
    await supabase.from('claims').update({ status: 'closed' }).eq('id', claimId)
    navigate('/dashboard')
  }

  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  function groupByDate(msgs) {
    const groups = {}
    msgs.forEach(msg => {
      const date = new Date(msg.created_at).toDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })
    return groups
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading chat...</p>
      </div>
    )
  }

  if (error && !claim) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
        <div className="text-center px-6">
          <p className="text-2xl mb-2">😕</p>
          <p className="text-sm" style={{ color: '#6B7280' }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-sm hover:underline active:opacity-70"
            style={{ color: '#1C3829' }}
          >
            ← Home
          </button>
        </div>
      </div>
    )
  }

  const isFinder = item?.reported_by === user?.id
  const otherPersonLabel = isFinder ? 'Claimer' : 'Finder'
  const groupedMessages = groupByDate(messages)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F0E8' }}>

      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10" style={{ borderColor: '#E8E2D8' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {/* Left: back + item title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-lg shrink-0 hover:opacity-70 active:opacity-50"
              style={{ color: '#9CA3AF' }}
            >
              ←
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight truncate" style={{ color: '#1C2B1E' }}>
                {item?.title}
              </p>
              <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                {isFinder ? '📬 Arranging handover with claimer' : '📦 Arranging handover with finder'}
              </p>
            </div>
          </div>
          {/* Right: handed over button */}
          <button
            onClick={handleHandover}
            disabled={closing}
            className="shrink-0 text-xs text-white px-2.5 sm:px-3 py-1.5 rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
            style={{ backgroundColor: '#2D6A4F' }}
          >
            {closing ? '...' : (
              <>
                <span className="hidden sm:inline">✅ Handed Over</span>
                <span className="sm:hidden">✅ Done</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Item info bar */}
      <div className="border-b px-4 py-2" style={{ backgroundColor: '#EEF9F4', borderColor: '#B7DFC9' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 text-xs flex-wrap" style={{ color: '#2D6A4F' }}>
          <span className="truncate">📍 {item?.location} · {item?.category}</span>
          <button
            onClick={() => navigate(`/item/${item?.id}`)}
            className="underline hover:opacity-70 active:opacity-50 shrink-0"
          >
            View item →
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">

          <div className="text-center">
            <span className="text-xs px-3 py-1 rounded-full"
              style={{ backgroundColor: '#E8E2D8', color: '#6B7280' }}>
              Claim accepted — coordinate the handover here
            </span>
          </div>

          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="text-center my-3">
                <span className="text-xs px-3 py-1 rounded-full"
                  style={{ backgroundColor: '#E8E2D8', color: '#9CA3AF' }}>
                  {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>
              {msgs.map(msg => {
                const isMe = msg.sender_id === user?.id
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className={`max-w-[78%] sm:max-w-xs lg:max-w-md flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && (
                        <span className="text-xs mb-1 px-1" style={{ color: '#9CA3AF' }}>{otherPersonLabel}</span>
                      )}
                      <div
                        className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-sm ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                        style={isMe
                          ? { backgroundColor: '#1C3829', color: '#FFFFFF' }
                          : { backgroundColor: '#FFFFFF', color: '#1C2B1E', border: '1px solid #E8E2D8' }
                        }
                      >
                        {msg.content}
                      </div>
                      <span className="text-xs mt-1 px-1" style={{ color: '#C4BAB0' }}>
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>No messages yet.</p>
              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>Say hello and arrange where to meet!</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t px-3 sm:px-4 py-3" style={{ borderColor: '#E8E2D8' }}>
        <div className="max-w-2xl mx-auto">
          {error && <p className="text-xs mb-2" style={{ color: '#DC2626' }}>{error}</p>}
          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) }
              }}
              placeholder="Type a message…"
              rows={1}
              className="flex-1 rounded-xl px-3 sm:px-4 py-2.5 text-sm focus:outline-none resize-none"
              style={{ border: '1px solid #E8E2D8', color: '#1C2B1E' }}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="shrink-0 text-white px-3 sm:px-4 py-2.5 rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all text-sm font-medium"
              style={{ backgroundColor: '#1C3829' }}
            >
              {sending ? '...' : 'Send'}
            </button>
          </form>
          <p className="text-xs mt-1.5 text-center" style={{ color: '#9CA3AF' }}>
            Keep it respectful. Arrange handover on campus.
          </p>
        </div>
      </div>

    </div>
  )
}