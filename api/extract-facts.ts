import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { serviceClient } from './_lib/db'
import { requireTeamUser, isHttpError } from './_lib/auth'

// Extração de fatos comportamentais a partir das conversas de um cliente
// (Fase 4 do roadmap — doc 02/04 do blueprint).

const FACTS_SCHEMA = {
  type: 'object',
  properties: {
    facts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fact_type: {
            type: 'string',
            enum: ['decisor', 'estilo_comunicacao', 'gatilho_fechamento', 'horario_resposta', 'precisa_lembrete', 'alerta', 'outro'],
          },
          value: { type: 'string', description: 'O fato, em uma frase curta em português' },
          confidence: { type: 'number', description: 'Confiança de 0 a 1' },
          evidence_message_ids: {
            type: 'array', items: { type: 'string' },
            description: 'IDs das mensagens que evidenciam o fato',
          },
        },
        required: ['fact_type', 'value', 'confidence', 'evidence_message_ids'],
        additionalProperties: false,
      },
    },
  },
  required: ['facts'],
  additionalProperties: false,
} as const

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(501).json({ error: 'IA não configurada. Defina ANTHROPIC_API_KEY no Vercel.' })
  }

  const db = serviceClient()
  try {
    const userId = await requireTeamUser(req, db)
    const { customer_id } = (req.body ?? {}) as { customer_id?: string }
    if (!customer_id) return res.status(400).json({ error: 'customer_id é obrigatório' })

    const [{ data: customer }, { data: contacts }, { data: existingFacts }] = await Promise.all([
      db.from('customers').select('name, segment').eq('id', customer_id).maybeSingle(),
      db.from('customer_contacts').select('id, name').eq('customer_id', customer_id),
      db.from('customer_facts').select('fact_type, value').eq('customer_id', customer_id),
    ])
    if (!customer) return res.status(404).json({ error: 'Cliente não encontrado' })

    const contactIds = (contacts ?? []).map((c) => c.id)
    if (contactIds.length === 0) return res.status(400).json({ error: 'Cliente sem contatos cadastrados' })

    const { data: conversations } = await db
      .from('wa_conversations').select('id, contact_id').in('contact_id', contactIds)
    const convIds = (conversations ?? []).map((c) => c.id)
    if (convIds.length === 0) return res.status(400).json({ error: 'Cliente ainda não tem conversas registradas' })

    const { data: messages } = await db
      .from('wa_messages')
      .select('id, direction, author, body, sent_at')
      .in('conversation_id', convIds)
      .order('sent_at', { ascending: false })
      .limit(150)
    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Nenhuma mensagem encontrada para este cliente' })
    }

    const transcript = [...messages].reverse().map((m) =>
      `[${m.id}] ${m.direction === 'inbound' ? 'CLIENTE' : 'EMPRESA'} (${new Date(m.sent_at).toLocaleString('pt-BR')}): ${m.body}`
    ).join('\n')

    const known = (existingFacts ?? []).map((f) => `- (${f.fact_type}) ${f.value}`).join('\n') || '(nenhum)'

    const anthropic = new Anthropic()
    const response = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 4096,
      system: `Você analisa conversas de WhatsApp entre a distribuidora de alimentos D'GUST e seus clientes B2B (padarias, mercados, restaurantes) para extrair FATOS COMPORTAMENTAIS COMERCIAIS que ajudem qualquer vendedor a atender o cliente sem depender de memória individual.

Extraia apenas fatos com valor comercial prático: quem decide, estilo de comunicação preferido, horários em que responde, gatilhos de fechamento ("quando diz X, costuma fechar"), necessidade de lembrete, alertas (reclamações, sensibilidades). Não registre dados pessoais sensíveis nem informações sem uso comercial. Não repita fatos já conhecidos (listados abaixo) a menos que a conversa os contradiga — nesse caso registre o fato atualizado. Cada fato deve citar os IDs das mensagens que o evidenciam. Se não houver fatos novos, retorne a lista vazia.`,
      messages: [{
        role: 'user',
        content: `Cliente: ${customer.name}${customer.segment ? ` (${customer.segment})` : ''}
Contatos: ${(contacts ?? []).map((c) => c.name).join(', ')}

Fatos já conhecidos:
${known}

Conversa (mais antiga → mais recente, cada linha prefixada com o ID da mensagem):
${transcript}`,
      }],
      output_config: { format: { type: 'json_schema', schema: FACTS_SCHEMA as unknown as Record<string, unknown> } },
    })

    if (response.stop_reason === 'refusal') {
      return res.status(502).json({ error: 'A IA recusou processar esta conversa. Tente novamente ou revise manualmente.' })
    }
    const textBlock = response.content.find((b) => b.type === 'text')
    const parsed = JSON.parse(textBlock && 'text' in textBlock ? textBlock.text : '{"facts":[]}') as {
      facts: { fact_type: string; value: string; confidence: number; evidence_message_ids: string[] }[]
    }

    const validIds = new Set(messages.map((m) => m.id))
    const rows = parsed.facts.map((f) => ({
      customer_id,
      fact_type: f.fact_type,
      value: f.value,
      confidence: Math.max(0, Math.min(1, f.confidence)),
      source: 'extracao_ia',
      evidence_message_ids: f.evidence_message_ids.filter((id) => validIds.has(id)),
      created_by: userId,
    }))

    if (rows.length > 0) {
      const { error } = await db.from('customer_facts').insert(rows)
      if (error) throw error
    }

    return res.status(200).json({ ok: true, extracted: rows.length, facts: rows })
  } catch (err) {
    if (isHttpError(err)) return res.status(err.status).json({ error: err.message })
    console.error('extract-facts error:', err)
    return res.status(500).json({ error: 'Falha na extração de fatos' })
  }
}
