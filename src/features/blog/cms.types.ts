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
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Entry?: CMSEntry[]
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Asset?: unknown[]
  }
}

interface CMSEntryResponse {
  sys: CMSMetadata
  fields: Record<string, unknown>
  includes?: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Entry?: CMSEntry[]
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Asset?: unknown[]
  }
}

type CMSQueryParams = Record<string, string | number | boolean | undefined>

export type { CMSEntry, CMSEntryResponse, CMSListItem, CMSListResponse, CMSMetadata, CMSQueryParams, CMSReference }
