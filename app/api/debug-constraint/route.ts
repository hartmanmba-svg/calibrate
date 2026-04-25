import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createAdminClient()

  // Query the constraint definition
  const { data, error } = await admin.rpc('get_career_stage_constraint' as never)

  if (error) {
    // Fall back: just try to select from profiles to see what values exist
    const { data: profiles, error: e2 } = await admin
      .from('profiles')
      .select('id, career_stage')
      .limit(5)

    return NextResponse.json({ constraintError: error.message, profiles, profilesError: e2?.message })
  }

  return NextResponse.json({ constraint: data })
}
