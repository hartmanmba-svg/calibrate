import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createAdminClient()

  // Check share_links table exists
  const { error: selectErr } = await admin
    .from('share_links')
    .select('id', { count: 'exact', head: true })

  // Test the RPC
  const testUserId = 'fb3d89d2-bb87-415e-88e9-db3f0b7dc552' // testuser123
  const { data: rpcData, error: rpcErr } = await admin.rpc('upsert_share_link', {
    p_user_id: testUserId,
  })

  return NextResponse.json({
    share_links_exists: !selectErr,
    select_error: selectErr?.message ?? null,
    rpc_result: rpcData ?? null,
    rpc_error: rpcErr?.message ?? null,
    rpc_error_code: rpcErr?.code ?? null,
  })
}
