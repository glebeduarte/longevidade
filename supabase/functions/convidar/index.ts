// Convida paciente ou membro da equipe por e-mail.
// Médica convida qualquer perfil. Equipe com permissão de cadastro convida só pacientes.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Body = {
  email: string
  full_name: string
  role: 'paciente' | 'equipe'
  redirect_to: string
  patient?: { phone?: string; birth_date?: string; location?: 'equilibre' | 'spinel' }
  perms?: Record<string, boolean | string | null>
  /** Cadastro manual: cria o acesso já confirmado, com esta senha, sem e-mail de convite. Só para equipe. */
  senha?: string
}

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: u } = await caller.auth.getUser()
    if (!u.user) return json({ erro: 'Entre novamente.' }, 401)

    const b = (await req.json()) as Body
    const email = b.email?.trim().toLowerCase()
    if (!email || !b.full_name?.trim()) return json({ erro: 'Informe nome e e-mail.' }, 400)

    const { data: isMedica } = await caller.rpc('is_medica')
    const { data: canManage } = await caller.rpc('has_perm', { p: 'manage_patients' })
    if (b.role === 'equipe' && !isMedica) return json({ erro: 'Só a médica convida a equipe.' }, 403)
    if (b.role === 'paciente' && !canManage) return json({ erro: 'Você não tem permissão para cadastrar pacientes.' }, 403)

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    if (b.role === 'paciente') {
      const { error } = await admin.from('patients').insert({
        full_name: b.full_name.trim(), email, created_by: u.user.id,
        phone: b.patient?.phone || null, birth_date: b.patient?.birth_date || null, location: b.patient?.location || null,
      })
      if (error) return json({ erro: 'Não foi possível cadastrar a paciente.' }, 400)
    }

    let inv: { user: { id: string } | null }
    if (b.senha) {
      if (b.role !== 'equipe') return json({ erro: 'Cadastro com senha é só para a equipe.' }, 400)
      if (b.senha.length < 8) return json({ erro: 'A senha precisa ter pelo menos 8 caracteres.' }, 400)
      const { data, error } = await admin.auth.admin.createUser({
        email, password: b.senha, email_confirm: true, user_metadata: { full_name: b.full_name.trim() },
      })
      if (error || !data.user) return json({ erro: error?.message?.includes('already') ? 'Já existe um acesso com este e-mail.' : 'Não foi possível criar o acesso.' }, 400)
      inv = data
    } else {
      const { data, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: b.full_name.trim() },
        redirectTo: b.redirect_to,
      })
      if (invErr || !data.user) return json({ erro: 'Não foi possível enviar o convite. Confira o e-mail.' }, 400)
      inv = data
    }

    if (b.role === 'equipe') {
      await admin.from('profiles').update({ role: 'equipe', full_name: b.full_name.trim() }).eq('id', inv.user!.id)
      const p = b.perms ?? {}
      await admin.from('team_permissions').upsert({
        user_id: inv.user!.id,
        can_manage_patients: !!p.can_manage_patients,
        can_upload_measurements: !!p.can_upload_measurements,
        can_answer_checkins: !!p.can_answer_checkins,
        can_view_clinical: !!p.can_view_clinical,
        is_partner: !!p.is_partner,
        partner_specialty: (p.partner_specialty as string) || null,
      })
    }
    return json({ ok: true })
  } catch (_e) {
    return json({ erro: 'Erro inesperado.' }, 500)
  }
})
