// Link temporário para baixar o PDF original da receita.
// Equipe clínica: sempre. Paciente: só a própria receita e só até a data de validade.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
    const { data: u } = await caller.auth.getUser()
    if (!u.user) return json({ erro: 'Entre novamente.' }, 401)
    const { id } = await req.json() as { id: string }

    // A leitura passa pelas regras do banco: só volta se a pessoa pode ver esta receita
    const { data: rx } = await caller.from('prescriptions').select('id, patient_id, file_path, valida_ate, numero').eq('id', id).maybeSingle()
    if (!rx) return json({ erro: 'Receita não encontrada.' }, 404)

    const { data: equipe } = await caller.rpc('has_perm', { p: 'view_clinical' })
    const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
    if (!equipe && rx.valida_ate < hoje) return json({ erro: 'Esta receita venceu. Peça uma nova à equipe.' }, 403)

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: s, error } = await admin.storage.from('receitas').createSignedUrl(rx.file_path, 120, { download: `receita-${rx.numero || rx.id}.pdf` })
    if (error || !s) return json({ erro: 'Não foi possível gerar o link.' }, 500)
    await caller.rpc('log_access', { pid: rx.patient_id, p_resource: 'receita', p_action: 'download' })
    return json({ url: s.signedUrl })
  } catch (_e) {
    return json({ erro: 'Erro inesperado.' }, 500)
  }
})
