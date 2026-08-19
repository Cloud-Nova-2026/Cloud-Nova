import { useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from './supabaseClient'

export default function Dashboard() {
  const [tab, setTab] = useState('home')
  const { profile, setProfile, signOut } = useAuth()

  const total = (profile?.total_income || 0) + (profile?.daily_income || 0) + (profile?.team_income || 0) + (profile?.referral_income || 0)

  const handleDailyReserve = async () => {
    if(!profile || profile.deposit_total < 30) return alert('Minimum $30 deposit required')
    const income = profile.deposit_total * 0.012
    const { data, error } = await supabase.from('profiles').update({
      daily_income: profile.daily_income + income,
      total_income: profile.total_income + income,
      order_count: profile.order_count + 1,
      bought_count: profile.bought_count + 1,
      sold_count: profile.sold_count + 1
    }).eq('id', profile.id).select().single()

    if(error) alert(error.message)
    else {
      setProfile(data)
      alert(`$${income.toFixed(2)} Added to Daily Income`)
    }
  }

  return (
    <div style={{padding:20, color:'white', background:'#0a0f1a', minHeight:'100vh'}}>

      {/* TOP NAV - 4 TABS */}
      <div style={{display:'flex', justifyContent:'space-around', marginBottom:20, borderBottom:'1px solid #333', paddingBottom:10}}>
        {['home','earn','asset','profile'].map(t =>
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab===t? '#1e90ff':'transparent',
              color:'white',
              border:'none',
              padding:'8px 15px',
              borderRadius:5,
              cursor:'pointer'
            }}
          >
            {t.toUpperCase()}
          </button>
        )}
      </div>

      {/* TAB CONTENT */}
      {tab === 'home' && <HomeTab profile={profile} total={total} onReserve={handleDailyReserve} />}
      {tab === 'earn' && <EarnTab profile={profile} onReserve={handleDailyReserve} />}
      {tab === 'asset' && <AssetTab profile={profile} />}
      {tab === 'profile' && <ProfileTab profile={profile} signOut={signOut} />}
    </div>
  )
}

// 1. HOME TAB
function HomeTab({ profile, total, onReserve }) {
  return (
    <div>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}><h2>Cloud Nova</h2><div>🔔 🎁 ⋮</div></header>

      <div style={{background:'#0a1a3a', padding:15, borderRadius:10, margin:'15px 0', textAlign:'center'}}>
        <p>Wallet Balance</p><h1>${profile?.deposit_total?.toFixed(2) || '0.00'} USDT</h1>
      </div>

      <table style={{width:'100%', borderCollapse:'collapse', marginBottom:15}}>
        <thead><tr style={{borderBottom:'1px solid #333'}}><th align="left">Table Name</th><th>Balance</th><th>Total</th></tr></thead>
        <tbody>
          <tr><td>Total income</td><td align="center">${profile?.total_income?.toFixed(2) || 0}</td><td align="center">${total.toFixed(2)}</td></tr>
          <tr><td>Daily Income</td><td align="center">${profile?.daily_income?.toFixed(2) || 0}</td><td align="center">${total.toFixed(2)}</td></tr>
          <tr><td>Team Income %</td><td align="center">${profile?.team_income?.toFixed(2) || 0}</td><td align="center">${total.toFixed(2)}</td></tr>
          <tr><td>Referral %</td><td align="center">${profile?.referral_income?.toFixed(2) || 0}</td><td align="center">${total.toFixed(2)}</td></tr>
          <tr style={{fontWeight:'bold'}}><td>GRAND TOTAL</td><td align="center">${total.toFixed(2)}</td><td align="center">${total.toFixed(2)}</td></tr>
        </tbody>
      </table>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, margin:'15px 0'}}>
        {['Members','A Enthusiast','B/C Enthusiast','Valid A','Valid B/C'].map((n,i)=>
          <div key={i} style={{border:'1px solid #333', padding:10, borderRadius:5, textAlign:'center'}}>
            {n}<br/><b>{[1+(profile?.a_count||0)+(profile?.bc_count||0), profile?.a_count||0, profile?.bc_count||0, profile?.valid_a_count||0, profile?.valid_bc_count||0][i]}</b>
          </div>
        )}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10}}>
        {['Order','Processing','Bought','Sold'].map((n,i)=>
          <div key={i} style={{border:'1px solid #333', padding:10, borderRadius:5, textAlign:'center'}}>
            {n}<br/><b>{[profile?.order_count||0, 0, profile?.bought_count||0, profile?.sold_count||0][i]}</b>
          </div>
        )}
      </div>
    </div>
  )
}

// 2. EARN TAB
function EarnTab({ profile, onReserve }) {
  return (
    <div style={{textAlign:'center'}}>
      <h2>Cloud Nova</h2>
      <div style={{background:'#0a1a3a', padding:15, borderRadius:10}}><p>Total Balance</p><h1>${profile?.deposit_total?.toFixed(2) || '0.00'} USDT</h1></div>
      <div style={{margin:'20px 0'}}>4 NFT Cards - Coming Soon</div>
      <p>Minimum deposit $30 required for Daily Reserve</p>
      <p>UTC Time: 5:00 AM Pakistan</p>
      <button onClick={onReserve} style={{background:'#1e90ff', color:'white', padding:'12px 30px', border:'none', borderRadius:5, cursor:'pointer'}}>Daily Reserve</button>
    </div>
  )
}

// 3. ASSET TAB
function AssetTab({ profile }) {
  return (
    <div>
      <h2>Cloud Nova</h2>
      <h1 style={{textAlign:'center'}}>${profile?.deposit_total?.toFixed(2) || '0.00'} USDT: Available</h1>
      <div style={{display:'flex', gap:10, justifyContent:'center', margin:'20px 0'}}>
        <button style={{background:'green', color:'white', padding:10, border:'none', borderRadius:5}}>Deposit</button>
        <button style={{background:'red', color:'white', padding:10, border:'none', borderRadius:5}}>Withdrawal</button>
      </div>
      <div>Transaction History - Coming Soon</div>
    </div>
  )
}

// 4. PROFILE TAB
function ProfileTab({ profile, signOut }) {
  const copy = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied!')
  }
  return (
    <div>
      <h2>Cloud Nova</h2>
      <div style={{background:'#0a1a3a', padding:15, borderRadius:10, margin:'15px 0'}}>
        <p>Profile Pic</p>
        <p>{profile?.email}</p>
        <p>UID: {profile?.uid} <button onClick={()=>copy(profile?.uid)}>Copy</button></p>
      </div>
      <div style={{margin:'15px 0'}}>
        <p>Referral Link <button onClick={()=>copy(profile?.referral_code)}>Copy</button></p>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:10}}>
        <button>Account Details</button>
        <button>My Team</button>
        <button>Security</button>
        <button>Setting</button>
        <button>Customer Help</button>
        <button onClick={signOut} style={{color:'red', background:'transparent', border:'1px solid red'}}>Sign Out</button>
      </div>
    </div>
  )
}