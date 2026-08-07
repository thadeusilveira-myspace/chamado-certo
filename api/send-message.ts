import type { VercelRequest, VercelResponse } from '@vercel/node'
import { serviceClient, findOrCreateConversation } from './_lib/db'

// Envio de mensagem pelo gateway (Evolution API), autenticado com o JWT
// do Supabase do usuário logado. Exige membro da equipe (user_roles).

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const gatewayUrl = process.env.EVOLUTION_API_URL
  const gatewayKey = process.env.EVOLUTION_API_KEY
  const instance = process.env.EVOLUTION_INSTANCE
  if (!gatewayUrl || !gatewayKey || !instance) {
    return res.status(501).json({
      error: 'Gateway não configurado. Defina EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE no Vercel.',
    })
  }

  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Não autenticado' })

  const db = serviceClient()
  const { data: userData, error: authErr } = await db.auth.getUser(token)
  if (authErr || !userData.user) return res.status(401).json({ error: 'Sessão inválida' })

  const { data: roles } = await db.from('user_roles').select('role').eq('user_id', userData.user.id)
  if (!roles || roles.length === 0) return res.status(403).json({ error: 'Usuário sem acesso aprovado' })

  const { contact_id, text } = (req.body ?? {}) as { contact_id?: string; text?: string }
  if (!contact_id || !text?.trim()) return res.status(400).json({ error: 'contact_id e text são obrigatórios' })

  const { data: contact } = await db
    .from('customer_contacts')
    .select('id, wa_phone, customers(do_not_contact)')
    .eq('id', contact_id)
    .maybeSingle()
  if (!contact) return res.status(404).json({ error: 'Contato não encontrado' })

  const customer = contact.customers as unknown as { do_not_contact: boolean } | null
  if (customer?.do_not_contact) {
    return res.status(403).json({ error: 'Cliente marcado como NÃO CONTATAR (opt-out)' })
  }

  // Evolution API v2: POST /message/sendText/{instance} { number, text }
  // (campo textMessage incluído por compatibilidade com v1)
  const gwRes = await fetch(`${gatewayUrl.replace(/\/$/, '')}/message/sendText/${instance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: gatewayKey },
    body: JSON.stringify({ number: contact.wa_phone, text, textMessage: { text } }),
  })
  if (!gwRes.ok) {
    const detail = await gwRes.text().catch(() => '')
    console.error('evolution send error:', gwRes.status, detail)
    return res.status(502).json({ error: `Gateway recusou o envio (${gwRes.status})` })
  }
  const gwBody = (await gwRes.json().catch(() => ({}))) as { key?: { id?: string } }

  const conversationId = await findOrCreateConversation(db, contact.id)
  const sentAt = new Date().toISOString()
  await db.from('wa_messages').insert({
    conversation_id: conversationId,
    wa_message_id: gwBody.key?.id ?? null,
    direction: 'outbound',
    author: 'humano',
    body: text,
    sent_at: sentAt,
  })
  await db.from('wa_conversations').update({ last_message_at: sentAt }).eq('id', conversationId)

  return res.status(200).json({ ok: true })
}
