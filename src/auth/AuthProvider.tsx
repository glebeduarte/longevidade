import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type Role = 'medica' | 'equipe' | 'paciente'
export type Perms = {
  can_manage_patients: boolean
  can_upload_measurements: boolean
  can_answer_checkins: boolean
  can_view_clinical: boolean
  is_partner: boolean
}
export type Profile = { id: string; full_name: string | null; email: string | null; role: Role; active: boolean }

type Ctx = {
  session: Session | null
  profile: Profile | null
  perms: Perms | null
  loading: boolean
  needsConsent: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthCtx = createContext<Ctx>(null as unknown as Ctx)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [perms, setPerms] = useState<Perms | null>(null)
  const [needsConsent, setNeedsConsent] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load(s: Session | null) {
    setSession(s)
    if (!s) {
      setProfile(null); setPerms(null); setNeedsConsent(false); setLoading(false)
      return
    }
    const uid = s.user.id
    const [{ data: p }, { data: t }, { data: term }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, role, active').eq('id', uid).maybeSingle(),
      supabase.from('team_permissions').select('*').eq('user_id', uid).maybeSingle(),
      supabase.from('consent_terms').select('id').not('published_at', 'is', null)
        .order('published_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    setProfile(p as Profile | null)
    setPerms(t as Perms | null)
    if (term && (p as Profile | null)?.role === 'paciente') {
      const { data: c } = await supabase.from('consents').select('id').eq('user_id', uid).eq('term_id', term.id).maybeSingle()
      setNeedsConsent(!c)
    } else {
      setNeedsConsent(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => load(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setTimeout(() => load(s), 0) })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <AuthCtx.Provider value={{
      session, profile, perms, loading, needsConsent,
      refresh: async () => load((await supabase.auth.getSession()).data.session),
      signOut: async () => { await supabase.auth.signOut() },
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function can(profile: Profile | null, perms: Perms | null, p: keyof Perms) {
  if (!profile) return false
  if (profile.role === 'medica') return true
  return profile.role === 'equipe' && !!perms?.[p]
}
