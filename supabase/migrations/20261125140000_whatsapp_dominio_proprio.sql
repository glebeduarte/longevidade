-- Links dos avisos por WhatsApp no domínio próprio (bartirareboucas.com.br)
do $$
declare f record;
begin
  for f in select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f' and pg_get_functiondef(p.oid) like '%longevidade-black.vercel.app%'
  loop
    execute replace(pg_get_functiondef(f.oid), 'https://longevidade-black.vercel.app', 'https://bartirareboucas.com.br');
  end loop;
end $$;
