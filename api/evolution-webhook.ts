import type { VercelRequest, VercelResponse } from '@vercel/node'
import { serviceClient, normalizePhone, findOrCreateContact, findOrCreateConversation } from './_lib/db'

// Webhook da Evolution API (evento messages.upsert).
// Configurar na Evolution: URL https://<app>.vercel.app/api/evolution-webhook?token=<EVOLUTION_WEBHOOK_TOKEN>

interface EvolutionMessage {
  key?: { remoteJid?: string; fromMe?: boolean; id?: string }
  pushName?: string
  message?: {
    conversation?: string
    extendedTextMessage?: { text?: string }
    imageMessage?: { caption?: string }
    videoMessage?: { caption?: string }
  }
  messageTimestamp?: number | string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const expected = process.env.EVOLUTION_WEBHOOK_TOKEN
  if (!expected) return res.status(500).json({ error: 'EVOLUTION_WEBHOOK_TOKEN não configurado' })
  const got = (req.query.token as string) ?? req.headers['x-webhook-token']
  if (got !== expected) return res.status(401).json({ error: 'Token inválido' })

  const body = req.body ?? {}
  const event: string = body.event ?? body.type ?? ''
  if (!event.replace('.', '_').toLowerCase().includes('messages_upsert')) {
    return res.status(200).json({ ok: true, skipped: event || 'unknown-event' })
  }

  // Evolution v1 manda data como objeto; algumas versões mandam array
  const items: EvolutionMessage[] = Array.isArray(body.data) ? body.data : [body.data].filter(Boolean)
  const db = serviceClient()
  let saved = 0

  for (const item of items) {
    try {
      const jid = item.key?.remoteJid ?? ''
      // grupos e broadcasts ficam fora da carteira
      if (!jid || jid.endsWith('@g.us') || jid.includes('broadcast')) continue

      const text =
        item.message?.conversation ??
        item.message?.extendedTextMessage?.text ??
        item.message?.imageMessage?.caption ??
        item.message?.videoMessage?.caption ??
        null
      if (!text) continue

      const phone = normalizePhone(jid)
      const fromMe = item.key?.fromMe === true
      const contact = await findOrCreateContact(db, phone, fromMe ? undefined : item.pushName)
      const conversationId = await findOrCreateConversation(db, contact.id)

      const ts = item.messageTimestamp
      const sentAt = ts ? new Date(Number(ts) * 1000).toISOString() : new Date().toISOString()

      const { error } = await db.from('wa_messages').upsert({
        conversation_id: conversationId,
        wa_message_id: item.key?.id ?? null,
        direction: fromMe ? 'outbound' : 'inbound',
        author: fromMe ? 'humano' : 'cliente',
        body: text,
        raw_payload: item as unknown as Record<string, unknown>,
        sent_at: sentAt,
      }, { onConflict: 'wa_message_id', ignoreDuplicates: true })
      if (error) throw error

      await db.from('wa_conversations')
        .update({ last_message_at: sentAt })
        .eq('id', conversationId)
      saved++
    } catch (err) {
      console.error('evolution-webhook item error:', err)
    }
  }

  return res.status(200).json({ ok: true, saved })
}
