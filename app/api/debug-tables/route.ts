import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createAdminClient()

  // Try to count rows in share_links
  const { error } = await admin
    .from('share_links')
    .select('id', { count: 'exact', head: true })

  return NextResponse.json({
    exists: !error,
    error: error?.message ?? null,
    code: error?.code ?? null,
  })
}
