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

  const bottomRef = useRef(null)   // auto-scroll to latest message

  // ── Load claim + item + messages ────────────────────────────────
  useEffect(() => {
    fetchAll()
  }, [claimId])

  // ── Real-time subscription ───────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${claimId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `claim_id=eq.${claimId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [claimId])

  // ── Auto-scroll on new message ───────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchAll() {
    setLoading(true)

    // Fetch claim + found item + both users
    const { data: claimData, error: claimErr } = await supabase
      .from('claims')
      .select('*, found_items(*, users(name, department))')
      .eq('id', claimId)
      .single()

    if (claimErr || !claimData) {
      setError('Chat not found.')
      setLoading(false)
      return
    }

    // Only finder or claimer can access
    const foundItem = claimData.found_items
    const isFinder = foundItem?.reported_by === user?.id
    const isClaimer = claimData.claimant_id === user?.id

    if (!isFinder && !isClaimer) {
      navigate('/')
      return
    }

    // Chat only available when claim is accepted
    if (claimData.status !== 'accepted') {
      navigate(`/item/${foundItem?.id}`)
      return
    }

    setClaim(claimData)
    setItem(foundItem)

    // Fetch existing messages
    const { data: msgData } = await supabase
      .from('messages')
      .select('*, users(name)')
      .eq('claim_id', claimId)
      .order('created_at', { ascending: true })

    setMessages(msgData || [])
    setLoading(false)
  }

  // ── Send a message ───────────────────────────────────────────────
  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)

    const { error: sendErr } = await supabase
      .from('messages')
      .insert({
        claim_id: claimId,
        sender_id: user.id,
        content: newMessage.trim(),
      })

    if (sendErr) {
      setError('Failed to send message.')
    } else {
      setNewMessage('')
    }

    setSending(false)
  }

  // ── Mark as handed over ──────────────────────────────────────────
  async function handleHandover() {
    if (!window.confirm('Mark this item as handed over? This will close the listing.')) return

    setClosing(true)

    // Update found_item status to closed
    await supabase
      .from('found_items')
      .update({ status: 'closed' })
      .eq('id', item.id)

    // Update claim status to closed
    await supabase
      .from('claims')
      .update({ status: 'closed' })
      .eq('id', claimId)

    navigate('/dashboard')
  }

  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    })
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short'
    })
  }

  // ── Group messages by date ───────────────────────────────────────
  function groupByDate(msgs) {
    const groups = {}
    msgs.forEach(msg => {
      const date = new Date(msg.created_at).toDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })
    return groups
  }

  // ── Loading / Error ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading chat...</p>
      </div>
    )
  }

  if (error && !claim) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-2">😕</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 text-blue-600 text-sm hover:underline">← Home</button>
        </div>
      </div>
    )
  }

  const isFinder = item?.reported_by === user?.id
  const otherPersonLabel = isFinder ? 'Claimer' : 'Finder'
  const groupedMessages = groupByDate(messages)

  // ── Main UI ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-gray-700 text-lg"
            >
              ←
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-800 leading-tight">{item?.title}</p>
              <p className="text-xs text-gray-400">
                {isFinder ? '📬 Arranging handover with claimer' : '📦 Arranging handover with finder'}
              </p>
            </div>
          </div>

          {/* Handed Over button */}
          <button
            onClick={handleHandover}
            disabled={closing}
            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {closing ? '...' : '✅ Handed Over'}
          </button>
        </div>
      </div>

      {/* Item summary bar */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-xs text-blue-600">
          <span>📍 {item?.location} · {item?.category}</span>
          <button
            onClick={() => navigate(`/item/${item?.id}`)}
            className="underline hover:text-blue-800"
          >
            View item →
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Intro notice */}
          <div className="text-center">
            <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
              Claim accepted — coordinate the handover here
            </span>
          </div>

          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="text-center my-3">
                <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-full">
                  {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>

              {msgs.map(msg => {
                const isMe = msg.sender_id === user?.id
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isMe && (
                        <span className="text-xs text-gray-400 mb-1 px-1">{otherPersonLabel}</span>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-xs text-gray-300 mt-1 px-1">
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
              <p className="text-sm text-gray-500">No messages yet.</p>
              <p className="text-xs text-gray-400 mt-1">Say hello and arrange where to meet!</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          {error && (
            <p className="text-xs text-red-500 mb-2">{error}</p>
          )}
          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
              placeholder="Type a message... (Enter to send)"
              rows={1}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {sending ? '...' : 'Send'}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-1.5 text-center">
            Keep it respectful. No personal contact details needed — arrange handover on campus.
          </p>
        </div>
      </div>

    </div>
  )
}