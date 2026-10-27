import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()

  const [lostItems, setLostItems] = useState([])
  const [myClaims, setMyClaims] = useState([])
  const [foundItems, setFoundItems] = useState([])
  const [incomingClaims, setIncomingClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    if (!authLoading && user) fetchData()
  }, [user, authLoading])

  async function fetchData() {
    setLoading(true)

    // 1. My lost reports
    const { data: lostData } = await supabase
      .from('lost_items')
      .select('*')
      .eq('reported_by', user.id)
      .order('created_at', { ascending: false })

    // 2. My found item posts
    const { data: foundData } = await supabase
      .from('found_items')
      .select('*')
      .eq('reported_by', user.id)
      .order('created_at', { ascending: false })

    // 3. Incoming claims — three-step to avoid PostgREST join-filter bug + users() join error
    //    Step A: IDs already in foundData
    //    Step B: fetch claims — NO users() join (that caused data: null)
    //    Step C: fetch claimer profiles separately and merge client-side
    let incomingData = []
    if (foundData?.length) {
      const myItemIds = foundData.map(i => i.id)

      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select('*, found_items(title, location, category)')
        .in('found_item_id', myItemIds)
        .order('created_at', { ascending: false })

      if (claimsError) {
        console.error('claims fetch error:', claimsError)
      } else if (claimsData?.length) {
        const claimerIds = [...new Set(claimsData.map(c => c.claimant_id))]
        const { data: claimerProfiles, error: profilesError } = await supabase
          .from('users')
          .select('id, name, department, roll_no')
          .in('id', claimerIds)

        if (profilesError) console.error('claimer profiles fetch error:', profilesError)

        const profileMap = Object.fromEntries(
          (claimerProfiles || []).map(p => [p.id, p])
        )
        incomingData = claimsData.map(c => ({
          ...c,
          users: profileMap[c.claimant_id] || null,
        }))
      }
    }

    // 4. Claims I submitted (as claimer)
    const { data: myClaimsData } = await supabase
      .from('claims')
      .select('*, found_items(title, location, category)')
      .eq('claimant_id', user.id)
      .order('created_at', { ascending: false })

    setLostItems(lostData || [])
    setFoundItems(foundData || [])
    setIncomingClaims(incomingData)
    setMyClaims(myClaimsData || [])
    setLoading(false)
  }

  async function acceptClaim(claim) {
    setActionLoading(claim.id)
    await supabase.from('claims').update({ status: 'accepted' }).eq('id', claim.id)
    await supabase.from('found_items').update({ status: 'claimed' }).eq('id', claim.found_item_id)
    await supabase.from('claims').update({ status: 'rejected' })
      .eq('found_item_id', claim.found_item_id).eq('status', 'pending').neq('id', claim.id)
    setActionLoading(null)
    fetchData()
  }

  async function rejectClaim(claimId) {
    setActionLoading(claimId)
    await supabase.from('claims').update({ status: 'rejected' }).eq('id', claimId)
    setActionLoading(null)
    fetchData()
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  function claimBadge(status) {
    const map = {
      pending:  { bg: '#FFFBEB', color: '#D97706', label: '⏳ Pending' },
      accepted: { bg: '#EEF9F4', color: '#2D6A4F', label: '✅ Accepted' },
      rejected: { bg: '#FEF2F2', color: '#DC2626', label: '❌ Rejected' },
      closed:   { bg: '#F3F4F6', color: '#6B7280', label: '✔ Closed' },
    }
    const s = map[status] || map.pending
    return (
      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
        style={{ backgroundColor: s.bg, color: s.color }}>
        {s.label}
      </span>
    )
  }

  function itemBadge(status) {
    const map = {
      active:    { bg: '#ECFDF5', color: '#059669', label: '🟢 Active' },
      claimed:   { bg: '#FFFBEB', color: '#D97706', label: '⏳ Claimed' },
      accepted:  { bg: '#EEF9F4', color: '#2D6A4F', label: '💬 In Chat' },
      closed:    { bg: '#F3F4F6', color: '#6B7280', label: '✔ Closed' },
      escalated: { bg: '#FEF2F2', color: '#DC2626', label: '🚨 Escalated' },
    }
    const s = map[status] || map.active
    return (
      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
        style={{ backgroundColor: s.bg, color: s.color }}>
        {s.label}
      </span>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading your dashboard...</p>
      </div>
    )
  }

  const pendingIncoming = incomingClaims.filter(c => c.status === 'pending')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>

      {/* Header */}
      <div className="bg-white border-b px-6 py-5" style={{ borderColor: '#E8E2D8' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1C2B1E', fontFamily: "'Lora','Georgia',serif" }}>
              My Dashboard
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
              {profile?.name ? `Welcome back, ${profile.name}` : 'Your activity'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/')}
              className="border text-sm px-4 py-2 rounded-xl hover:opacity-70 transition-opacity"
              style={{ borderColor: '#E8E2D8', color: '#6B7280' }}>
              ← Home
            </button>
            <button onClick={() => navigate('/report-lost')}
              className="text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity font-medium"
              style={{ backgroundColor: '#1C3829' }}>
              + Report Lost
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

        {/* ══ SECTION 1: Incoming Claims ══ */}
        <section>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#1C2B1E' }}>
            📬 Incoming Claims
            {pendingIncoming.length > 0 && (
              <span className="ml-2 text-white text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#DC2626' }}>
                {pendingIncoming.length} new
              </span>
            )}
          </h2>

          {incomingClaims.length === 0 ? (
            <div className="rounded-2xl p-8 text-center border border-dashed"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#D1C9BB' }}>
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>No one has claimed your found items yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingClaims.map(claim => (
                <div key={claim.id} className="bg-white rounded-2xl p-5"
                  style={{
                    border: claim.status === 'pending' ? '1px solid #B7DFC9' : '1px solid #E8E2D8',
                    boxShadow: claim.status === 'pending' ? '0 1px 4px rgba(45,106,79,0.08)' : 'none',
                  }}>

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: '#9CA3AF' }}>Claim on</p>
                      <p className="text-sm font-semibold" style={{ color: '#1C2B1E' }}>
                        {claim.found_items?.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                        by {claim.users?.name || 'a student'}
                        {claim.users?.roll_no ? ` · ${claim.users.roll_no}` : ''}
                        {claim.users?.department ? ` · ${claim.users.department}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {claimBadge(claim.status)}
                      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{formatDate(claim.created_at)}</p>
                    </div>
                  </div>

                  {claim.proof_description && (
                    <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: '#F5F0E8' }}>
                      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#9CA3AF' }}>
                        Their ownership description:
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                        "{claim.proof_description}"
                      </p>
                    </div>
                  )}

                  {claim.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => acceptClaim(claim)} disabled={actionLoading === claim.id}
                        className="flex-1 text-white text-sm py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 font-medium"
                        style={{ backgroundColor: '#2D6A4F' }}>
                        {actionLoading === claim.id ? '...' : '✅ Accept — sounds right'}
                      </button>
                      <button onClick={() => rejectClaim(claim.id)} disabled={actionLoading === claim.id}
                        className="flex-1 text-sm py-2.5 rounded-xl disabled:opacity-50 hover:opacity-80"
                        style={{ border: '1px solid #FECACA', color: '#DC2626', backgroundColor: '#FEF2F2' }}>
                        ❌ Reject
                      </button>
                    </div>
                  )}

                  {claim.status === 'accepted' && (
                    <button onClick={() => navigate(`/chat/${claim.id}`)}
                      className="w-full text-white text-sm py-2.5 rounded-xl hover:opacity-90 font-medium"
                      style={{ backgroundColor: '#1C3829' }}>
                      💬 Open Chat →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ══ SECTION 2: Items I Found & Posted ══ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: '#1C2B1E' }}>
              📦 Items I Found &amp; Posted
              <span className="ml-2 text-sm font-normal" style={{ color: '#9CA3AF' }}>({foundItems.length})</span>
            </h2>
            <button onClick={() => navigate('/report-found')}
              className="text-sm hover:underline" style={{ color: '#2D6A4F' }}>
              + Post found item
            </button>
          </div>

          {foundItems.length === 0 ? (
            <div className="rounded-2xl p-8 text-center border border-dashed"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#D1C9BB' }}>
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>You haven't posted any found items yet.</p>
              <button onClick={() => navigate('/report-found')}
                className="mt-3 text-sm hover:underline" style={{ color: '#2D6A4F' }}>
                Post a found item →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {foundItems.map(item => (
                <div key={item.id} onClick={() => navigate(`/item/${item.id}`)}
                  className="bg-white rounded-2xl border p-4 flex items-start justify-between gap-4 cursor-pointer hover:shadow-sm transition-all"
                  style={{ borderColor: '#E8E2D8' }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: '#F5F0E8', color: '#374151' }}>
                        {item.category}
                      </span>
                      {itemBadge(item.status)}
                    </div>
                    <h3 className="font-semibold text-sm" style={{ color: '#1C2B1E' }}>{item.title}</h3>
                    {item.description && (
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#9CA3AF' }}>{item.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{formatDate(item.created_at)}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>📍 {item.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ══ SECTION 3: My Claims (as claimer) ══ */}
        <section>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#1C2B1E' }}>
            🙋 My Claims
            <span className="ml-2 text-sm font-normal" style={{ color: '#9CA3AF' }}>({myClaims.length})</span>
          </h2>

          {myClaims.length === 0 ? (
            <div className="rounded-2xl p-8 text-center border border-dashed"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#D1C9BB' }}>
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>You haven't claimed any found items yet.</p>
              <button onClick={() => navigate('/')}
                className="mt-3 text-sm hover:underline" style={{ color: '#2D6A4F' }}>
                Browse found items →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myClaims.map(claim => (
                <div key={claim.id} className="bg-white rounded-2xl border p-4"
                  style={{ borderColor: '#E8E2D8' }}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: '#F5F0E8', color: '#374151' }}>
                          {claim.found_items?.category}
                        </span>
                        {claimBadge(claim.status)}
                      </div>
                      <h3 className="font-semibold text-sm" style={{ color: '#1C2B1E' }}>
                        {claim.found_items?.title}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                        📍 {claim.found_items?.location}
                      </p>
                    </div>
                    <p className="text-xs shrink-0" style={{ color: '#9CA3AF' }}>{formatDate(claim.created_at)}</p>
                  </div>

                  {claim.status === 'accepted' && (
                    <button onClick={() => navigate(`/chat/${claim.id}`)}
                      className="w-full mt-2 text-white text-sm py-2.5 rounded-xl hover:opacity-90 font-medium"
                      style={{ backgroundColor: '#1C3829' }}>
                      💬 Open Chat →
                    </button>
                  )}

                  {claim.status === 'pending' && (
                    <button onClick={() => navigate(`/item/${claim.found_item_id}`)}
                      className="w-full mt-2 border text-sm py-2 rounded-xl hover:opacity-70 transition-opacity"
                      style={{ borderColor: '#E8E2D8', color: '#6B7280' }}>
                      View item →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ══ SECTION 4: My Lost Reports ══ */}
        <section>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#1C2B1E' }}>
            🔍 My Lost Reports
            <span className="ml-2 text-sm font-normal" style={{ color: '#9CA3AF' }}>({lostItems.length})</span>
          </h2>

          {lostItems.length === 0 ? (
            <div className="rounded-2xl p-8 text-center border border-dashed"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#D1C9BB' }}>
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>You haven't reported any lost items yet.</p>
              <button onClick={() => navigate('/report-lost')}
                className="mt-3 text-sm hover:underline" style={{ color: '#2D6A4F' }}>
                Report something lost →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {lostItems.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border p-4 flex items-start justify-between gap-4"
                  style={{ borderColor: '#E8E2D8' }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: '#F5F0E8', color: '#374151' }}>
                        {item.category}
                      </span>
                      {itemBadge(item.status)}
                    </div>
                    <h3 className="font-semibold text-sm" style={{ color: '#1C2B1E' }}>{item.title}</h3>
                    {item.description && (
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#9CA3AF' }}>{item.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{formatDate(item.created_at)}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                      📍 {item.location_last_seen || item.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}