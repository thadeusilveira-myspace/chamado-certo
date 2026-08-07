import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Cliente com service role — SÓ pode existir no servidor (funções /api).
export function serviceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados')
  return createClient(url, key, { auth: { persistSession: false } })
}

export function normalizePhone(jidOrPhone: string): string {
  return jidOrPhone.split('@')[0].split(':')[0].replace(/\D/g, '')
}

// Localiza contato pelo telefone; cria cliente+contato se não existir
// (mensagem de número desconhecido ainda precisa aparecer no inbox).
export async function findOrCreateContact(db: SupabaseClient, phone: string, pushName?: string) {
  const { data: existing } = await db
    .from('customer_contacts').select('id, customer_id').eq('wa_phone', phone).maybeSingle()
  if (existing) return existing

  const { data: customer, error: custErr } = await db
    .from('customers')
    .insert({ name: pushName ? `${pushName} (novo contato)` : `Contato ${phone}` })
    .select('id').single()
  if (custErr) throw custErr

  const { data: contact, error: contErr } = await db
    .from('customer_contacts')
    .insert({ customer_id: customer.id, name: pushName ?? phone, wa_phone: phone })
    .select('id, customer_id').single()
  if (contErr) throw contErr
  return contact
}

export async function findOrCreateConversation(db: SupabaseClient, contactId: string): Promise<string> {
  const { data: existing } = await db
    .from('wa_conversations').select('id').eq('contact_id', contactId).maybeSingle()
  if (existing) return existing.id
  const { data, error } = await db
    .from('wa_conversations').insert({ contact_id: contactId }).select('id').single()
  if (error) throw error
  return data.id
}
