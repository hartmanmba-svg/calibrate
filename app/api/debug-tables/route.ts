import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createAdminClient()

  const { data, error } = await admin.rpc('list_public_tables' as never)

  return NextResponse.json({
    tables: data ?? null,
    error: error?.message ?? null,
  })
}
