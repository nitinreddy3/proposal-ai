import { z } from 'zod'
import type { OpportunitySyncRequest } from '@/types/opportunity'

const samGovNoticeSchema = z.object({
  noticeId: z.string().optional(),
  solicitationNumber: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  organizationType: z.string().optional(),
  office: z.string().optional(),
  responseDeadLine: z.string().optional(),
  archiveDate: z.string().optional(),
  postedDate: z.string().optional(),
  typeOfSetAsideDescription: z.string().optional(),
  naicsCode: z.string().optional(),
  description: z.string().optional(),
  uiLink: z.string().optional(),
})

const samGovResponseSchema = z.object({
  opportunitiesData: z.array(samGovNoticeSchema).default([]),
})

export interface SamGovOpportunityRecord {
  readonly externalId: string
  readonly title: string
  readonly agencyName: string | null
  readonly dueDate: string | null
  readonly postedDate: string | null
  readonly setAside: string | null
  readonly naicsCode: string | null
  readonly description: string | null
  readonly opportunityUrl: string | null
  readonly rawPayload: Record<string, unknown>
}

function normalizeSamGovNotice(
  notice: z.infer<typeof samGovNoticeSchema>,
): SamGovOpportunityRecord | null {
  const externalId = notice.noticeId ?? notice.solicitationNumber ?? ''
  const title = notice.title?.trim() ?? ''

  if (!externalId || !title) {
    return null
  }

  const agencyName = [notice.department, notice.office]
    .filter(Boolean)
    .join(' - ')
    .trim() || null

  return {
    externalId,
    title,
    agencyName,
    dueDate: notice.responseDeadLine ?? null,
    postedDate: notice.postedDate ?? null,
    setAside: notice.typeOfSetAsideDescription ?? null,
    naicsCode: notice.naicsCode ?? null,
    description: notice.description ?? null,
    opportunityUrl: notice.uiLink ?? null,
    rawPayload: notice,
  }
}

/**
 * Fetches SAM.gov opportunities and normalizes records for persistence.
 */
export async function fetchSamGovOpportunities(
  input: OpportunitySyncRequest,
): Promise<SamGovOpportunityRecord[]> {
  const apiKey = process.env.SAM_GOV_API_KEY
  if (!apiKey) {
    throw new Error('Missing SAM_GOV_API_KEY')
  }

  const searchParams = new URLSearchParams({
    api_key: apiKey,
    limit: String(input.limit),
  })

  if (input.keyword) searchParams.set('q', input.keyword)
  if (input.agency) searchParams.set('department', input.agency)
  if (input.postedFrom) searchParams.set('postedFrom', input.postedFrom)
  if (input.postedTo) searchParams.set('postedTo', input.postedTo)

  const response = await fetch(
    `https://api.sam.gov/prod/opportunities/v2/search?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`SAM.gov request failed: ${response.status} ${message}`)
  }

  const parsedPayload = samGovResponseSchema.safeParse(await response.json())
  if (!parsedPayload.success) {
    throw new Error('Unexpected SAM.gov response format')
  }

  return parsedPayload.data.opportunitiesData
    .map((notice) => normalizeSamGovNotice(notice))
    .filter((record): record is SamGovOpportunityRecord => record !== null)
}
