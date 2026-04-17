import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDraftByToken } from '@/lib/submissions/service'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Draft token is required.' }, { status: 400 })
    }

    const draft = await getDraftByToken(token)

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found or expired.' }, { status: 404 })
    }

    // Load the teacher info
    const supabase = createAdminClient()
    const { data: teacher } = await supabase
      .from('user_master')
      .select('name, email, phone, school_name')
      .eq('id', draft.user_id)
      .single()

    return NextResponse.json({
      submission: {
        id: draft.id,
        formData: draft.form_data,
        status: draft.status,
        draftToken: draft.draft_token,
      },
      teacherInfo: teacher as Database['public']['Tables']['user_master']['Row'] | null,
    })
  } catch (error) {
    console.error('[API] GET /api/submissions/draft', error)
    return NextResponse.json({ error: 'Unable to load your draft.' }, { status: 500 })
  }
}
