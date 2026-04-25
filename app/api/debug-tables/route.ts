import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createAdminClient()

  // List all tables in public schema
  const { data: tables, error: tablesErr } = await admin
    .from('information_schema.tables' as never)
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE')

  return NextResponse.json({
    tables: (tables as { table_name: string }[] | null)?.map((t) => t.table_name).sort() ?? null,
    tables_error: tablesErr?.message ?? null,
  })
}
