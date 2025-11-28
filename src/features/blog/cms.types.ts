interface CMSMetadata {
  id: string
  type: string
  linkType?: string
}

interface CMSReference {
  sys: CMSMetadata
}

interface CMSEntry {
  sys: CMSMetadata
  fields: Record<string, unknown>
}

interface CMSListItem {
  sys: CMSMetadata
}

interface CMSListResponse {
  items: CMSEntry[]
  total: number
  includes?: {
    Entry?: CMSEntry[]
    Asset?: unknown[]
  }
}

interface CMSEntryResponse {
  sys: CMSMetadata
  fields: Record<string, unknown>
  includes?: {
    Entry?: CMSEntry[]
    Asset?: unknown[]
  }
}

type CMSQueryParams = Record<string, string | number | boolean | undefined>

export type { CMSEntry, CMSEntryResponse, CMSListItem, CMSListResponse, CMSMetadata, CMSQueryParams, CMSReference }
