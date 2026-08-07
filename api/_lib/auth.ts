import type { VercelRequest } from '@vercel/node'
import type { SupabaseClient } from '@supabase/supabase-js'

// Valida o JWT do Supabase e exige membro da equipe (user_roles).
// Retorna o user id ou lança { status, message }.
export async function requireTeamUser(req: VercelRequest, db: SupabaseClient): Promise<string> {
  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
  if (!token) throw { status: 401, message: 'Não autenticado' }

  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) throw { status: 401, message: 'Sessão inválida' }

  const { data: roles } = await db.from('user_roles').select('role').eq('user_id', data.user.id)
  if (!roles || roles.length === 0) throw { status: 403, message: 'Usuário sem acesso aprovado' }

  return data.user.id
}

export function isHttpError(e: unknown): e is { status: number; message: string } {
  return typeof e === 'object' && e !== null && 'status' in e && 'message' in e
}
