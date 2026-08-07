import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { serviceClient } from './_lib/db'
import { requireTeamUser, isHttpError } from './_lib/auth'

// Sugestão de abordagem por IA (nível 1 — copiloto), usando memória
// comercial + playbook + conversa recente. Doc 04 do blueprint.

const SUGGESTION_SCHEMA = {
  type: 'object',
  properties: {
    message: { type: 'string', description: 'A mensagem de WhatsApp pronta para enviar, em português informal brasileiro' },
    rationale: { type: 'string', description: 'Uma frase explicando por que esta abordagem, citando os fatos/padrões usados' },
  },
  required: ['message', 'rationale'],
  additionalProperties: false,
} as const

const DOW = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(501).json({ error: 'IA não configurada. Defina ANTHROPIC_API_KEY no Vercel.' })
  }

  const db = serviceClient()
  try {
    await requireTeamUser(req, db)
    const { customer_id } = (req.body ?? {}) as { customer_id?: string }
    if (!customer_id) return res.status(400).json({ error: 'customer_id é obrigatório' })

    const [{ data: entry }, { data: facts }, { data: contacts }, { data: playbook }, { data: orders }] = await Promise.all([
      db.from('radar_current').select('*').eq('customer_id', customer_id).maybeSingle(),
      db.from('customer_facts').select('fact_type, value, confidence').eq('customer_id', customer_id),
      db.from('customer_contacts').select('id, name, is_decision_maker').eq('customer_id', customer_id),
      db.from('playbook_entries').select('situation, approach, example_message, times_used, times_converted').eq('active', true),
      db.from('orders').select('qty_total, total, confirmed_at, delivery_date').eq('customer_id', customer_id).order('confirmed_at', { ascending: false }).limit(6),
    ])
    if (!entry) return res.status(404).json({ error: 'Cliente não encontrado' })
    if (entry.do_not_contact) return res.status(403).json({ error: 'Cliente marcado como NÃO CONTATAR (opt-out)' })

    const contact = (contacts ?? []).find((c) => c.is_decision_maker) ?? (contacts ?? [])[0]

    // conversa recente (últimas 30 mensagens), se houver
    let recentTranscript = '(nenhuma conversa registrada)'
    const contactIds = (contacts ?? []).map((c) => c.id)
    if (contactIds.length > 0) {
      const { data: conversations } = await db.from('wa_conversations').select('id').in('contact_id', contactIds)
      const convIds = (conversations ?? []).map((c) => c.id)
      if (convIds.length > 0) {
        const { data: messages } = await db
          .from('wa_messages').select('direction, body, sent_at')
          .in('conversation_id', convIds)
          .order('sent_at', { ascending: false }).limit(30)
        if (messages && messages.length > 0) {
          recentTranscript = [...messages].reverse()
            .map((m) => `${m.direction === 'inbound' ? 'CLIENTE' : 'EMPRESA'}: ${m.body}`)
            .join('\n')
        }
      }
    }

    const perfil = [
      `Estado no radar: ${entry.state}`,
      entry.cycle_days_median ? `Ciclo de compra: ~${Math.round(Number(entry.cycle_days_median))} dias` : null,
      entry.qty_median ? `Quantidade típica: ${entry.qty_median} unidades` : null,
      entry.ticket_avg ? `Ticket médio: R$ ${entry.ticket_avg}` : null,
      entry.next_expected_on ? `Próximo pedido esperado: ${entry.next_expected_on}` : null,
      entry.typical_confirm_dow != null ? `Costuma confirmar: ${DOW[entry.typical_confirm_dow]}${entry.typical_confirm_hour != null ? ` ~${entry.typical_confirm_hour}h` : ''}` : null,
    ].filter(Boolean).join('\n')

    const factsText = (facts ?? []).map((f) => `- (${f.fact_type}) ${f.value}`).join('\n') || '(nenhum fato registrado)'
    const playbookText = (playbook ?? []).map((p) =>
      `- Situação: ${p.situation} → Abordagem: ${p.approach}${p.example_message ? ` (ex.: "${p.example_message}")` : ''}${p.times_used > 0 ? ` [conversão: ${p.times_converted}/${p.times_used}]` : ''}`
    ).join('\n') || '(playbook ainda vazio)'
    const ordersText = (orders ?? []).map((o) =>
      `- ${new Date(o.confirmed_at).toLocaleDateString('pt-BR')}: ${o.qty_total ?? '?'} un, R$ ${o.total}`
    ).join('\n') || '(sem pedidos)'

    const anthropic = new Anthropic()
    const response = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 1024,
      system: `Você é o copiloto comercial da D'GUST, distribuidora de alimentos que vende para padarias, mercados e restaurantes via WhatsApp. Sua tarefa: redigir UMA mensagem de WhatsApp proativa para o cliente indicado, no tom certo para ele, com o objetivo de confirmar/recuperar o pedido recorrente.

Regras:
- Mensagem curta (1 a 3 frases), natural, em português brasileiro. WhatsApp comercial entre conhecidos, não formal.
- Use os fatos comportamentais do cliente (estilo, decisor, gatilhos) e o playbook quando a situação bater.
- Proposta concreta funciona melhor que pergunta aberta (ex.: "coloco as 6 de sempre?" em vez de "vai querer algo?").
- Se o estado for "esfriando", reaproxime sem cobrar; nunca soe como cobrança automática.
- Não invente promoções, preços ou prazos que não estejam nos dados.
- Nunca finja ser uma pessoa específica; escreva como a equipe da D'GUST.`,
      messages: [{
        role: 'user',
        content: `Cliente: ${entry.name}${entry.segment ? ` (${entry.segment})` : ''}
Contato: ${contact?.name ?? '(desconhecido)'}

PERFIL COMERCIAL:
${perfil}

ÚLTIMOS PEDIDOS:
${ordersText}

FATOS COMPORTAMENTAIS:
${factsText}

PLAYBOOK DA EMPRESA (abordagens que funcionam):
${playbookText}

CONVERSA RECENTE:
${recentTranscript}`,
      }],
      output_config: { format: { type: 'json_schema', schema: SUGGESTION_SCHEMA as unknown as Record<string, unknown> } },
    })

    if (response.stop_reason === 'refusal') {
      return res.status(502).json({ error: 'A IA recusou gerar a sugestão. Use a sugestão padrão.' })
    }
    const textBlock = response.content.find((b) => b.type === 'text')
    const parsed = JSON.parse(textBlock && 'text' in textBlock ? textBlock.text : '{}') as {
      message?: string; rationale?: string
    }
    if (!parsed.message) return res.status(502).json({ error: 'Resposta inválida da IA' })

    const { data: suggestion, error } = await db.from('outreach_suggestions').insert({
      customer_id,
      radar_state: entry.state,
      draft_message: parsed.message,
      rationale: parsed.rationale ?? null,
    }).select('id').single()
    if (error) throw error

    return res.status(200).json({
      ok: true,
      suggestion_id: suggestion.id,
      message: parsed.message,
      rationale: parsed.rationale,
    })
  } catch (err) {
    if (isHttpError(err)) return res.status(err.status).json({ error: err.message })
    console.error('suggest-message error:', err)
    return res.status(500).json({ error: 'Falha ao gerar sugestão' })
  }
}
