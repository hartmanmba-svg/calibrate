import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import * as ReactPDF from '@react-pdf/renderer'
import React from 'react'

// @react-pdf/renderer is used for PDF generation (server-side only).

const { renderToBuffer, Document, Page, Text, View, StyleSheet } = ReactPDF

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 60,
    fontFamily: 'Helvetica',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  brand: {
    fontSize: 28,
    color: '#E8611A',
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 11,
    color: '#8A97A5',
    marginBottom: 48,
    letterSpacing: 1,
  },
  heading: {
    fontSize: 22,
    color: '#2C3E50',
    marginBottom: 32,
    textAlign: 'center',
  },
  label: {
    fontSize: 10,
    color: '#8A97A5',
    letterSpacing: 1.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  name: {
    fontSize: 26,
    color: '#1A252F',
    marginBottom: 32,
    textAlign: 'center',
  },
  moduleTitle: {
    fontSize: 16,
    color: '#1ABBE8',
    marginBottom: 8,
    textAlign: 'center',
  },
  credits: {
    fontSize: 13,
    color: '#2C3E50',
    marginBottom: 48,
    textAlign: 'center',
  },
  date: {
    fontSize: 11,
    color: '#8A97A5',
    marginBottom: 48,
    textAlign: 'center',
  },
  footer: {
    fontSize: 10,
    color: '#8A97A5',
    textAlign: 'center',
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: '#E8611A',
    marginBottom: 40,
  },
})

// Build the PDF document element — returns a ReactPDF.DocumentProps element
function buildCertificate({
  userName,
  moduleTitle,
  credits,
  completedAt,
  careerStage,
}: {
  userName: string
  moduleTitle: string
  credits: number
  completedAt: string
  careerStage: string
}): React.ReactElement<ReactPDF.DocumentProps> {
  const dateStr = new Date(completedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>calibrate.</Text>
        <Text style={styles.tagline}>Sharpen your edge.</Text>
        <Text style={styles.heading}>Certificate of Completion</Text>
        <View style={styles.divider} />
        <Text style={styles.label}>This certifies that</Text>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.label}>has successfully completed</Text>
        <Text style={styles.moduleTitle}>{moduleTitle}</Text>
        <Text style={styles.credits}>
          {credits} Continuing Education Credit{credits !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.date}>Completed: {dateStr}</Text>
        <Text style={styles.footer}>
          {`Career stage: ${careerStage}\nCalirate — Intraoperative Neuromonitoring Education Platform`}
        </Text>
      </Page>
    </Document>
  ) as React.ReactElement<ReactPDF.DocumentProps>
}

export async function GET(request: NextRequest) {
  // Auth check via server client
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const moduleId = searchParams.get('module_id')
  if (!moduleId) {
    return new NextResponse('module_id is required', { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch completion — must exist and be completed
  const { data: completion } = await admin
    .from('ce_completions')
    .select('completed_at, module_id')
    .eq('user_id', user.id)
    .eq('module_id', moduleId)
    .maybeSingle()

  if (!completion || !completion.completed_at) {
    return new NextResponse('Certificate not available — module not completed', { status: 404 })
  }

  // Fetch module details
  const { data: ceModule } = await admin
    .from('ce_modules')
    .select('title, credits')
    .eq('id', moduleId)
    .maybeSingle()

  if (!ceModule) {
    return new NextResponse('Module not found', { status: 404 })
  }

  // Fetch user profile
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, career_stage')
    .eq('id', user.id)
    .maybeSingle()

  const userName = profile?.full_name ?? user.email ?? 'Practitioner'
  const careerStage = profile?.career_stage ?? 'student'

  // Generate PDF — renderToBuffer returns a Node.js Buffer
  const pdfBuffer = await renderToBuffer(
    buildCertificate({
      userName,
      moduleTitle: ceModule.title,
      credits: ceModule.credits,
      completedAt: completion.completed_at,
      careerStage,
    })
  )

  const safeTitle = ceModule.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()

  // Convert Buffer to Uint8Array for NextResponse compatibility
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="calibrate_certificate_${safeTitle}.pdf"`,
    },
  })
}
