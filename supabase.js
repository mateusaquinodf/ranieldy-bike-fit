// ============================================================
// supabase.js — Cliente Supabase (carregado via CDN no HTML)
// Substitua SUPABASE_URL e SUPABASE_ANON_KEY pelos valores
// do seu projeto em https://supabase.com/dashboard
// ============================================================

const SUPABASE_URL  = 'https://pvpzredpopoqlqqbckpx.supabase.co';
const SUPABASE_ANON = 'sb_publishable_YgataXeGV-5Io2Zv4Jkj6A_PtDmEdt8';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

export default sb;
