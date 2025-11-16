import type { IApplicationDocument, DocumentCategory, DocumentStatus } from '@/models/ApplicationDocument';

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'resume',
  'transcript',
  'test_score',
  'portfolio',
  'counselor_form',
  'other',
];

export const DOCUMENT_STATUSES: DocumentStatus[] = ['draft', 'in_review', 'ready', 'submitted'];

const normalizeDate = (value?: string | Date | null): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const cleanupArray = (value?: unknown[]): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => String(entry || '').trim())
        .filter(Boolean)
        .slice(0, 12)
    : [];

const normalizeResumeSections = (value: any) => {
  if (!Array.isArray(value)) return undefined;
  const sections = value
    .map((section) => ({
      heading: String(section?.heading || '').trim(),
      bullets: cleanupArray(section?.bullets || []),
    }))
    .filter((section) => section.heading || section.bullets.length > 0);

  return sections.length ? sections : undefined;
};

const normalizePortfolioLinks = (value: any) => {
  if (!Array.isArray(value)) return undefined;
  const links = value
    .map((link) => ({
      label: String(link?.label || '').trim(),
      url: String(link?.url || '').trim(),
    }))
    .filter((link) => link.label || link.url);

  return links.length ? links : undefined;
};

const normalizeMetadata = (metadata: any) => {
  if (!metadata || typeof metadata !== 'object') return {};
  const normalized: Record<string, unknown> = {};

  if (metadata.testName) normalized.testName = String(metadata.testName).trim();
  const testDate = normalizeDate(metadata.testDate);
  if (testDate) normalized.testDate = testDate;
  if (metadata.score) normalized.score = String(metadata.score).trim();
  if (metadata.superscore) normalized.superscore = String(metadata.superscore).trim();
  const sections = normalizeResumeSections(metadata.resumeSections);
  if (sections) normalized.resumeSections = sections;
  const links = normalizePortfolioLinks(metadata.portfolioLinks);
  if (links) normalized.portfolioLinks = links;
  if (metadata.counselorContact) {
    normalized.counselorContact = String(metadata.counselorContact).trim();
  }

  return normalized;
};

export const sanitizeDocumentPayload = (payload: any) => {
  const safeCategory = DOCUMENT_CATEGORIES.includes(payload?.category) ? payload.category : 'other';
  const safeStatus = DOCUMENT_STATUSES.includes(payload?.status) ? payload.status : 'draft';

  const tags = cleanupArray(payload?.tags);
  const collegeIds = cleanupArray(payload?.collegeIds);

  const documentPayload = {
    title: String(payload?.title || '').trim(),
    category: safeCategory,
    status: safeStatus,
    description: payload?.description ? String(payload.description) : undefined,
    fileUrl: payload?.fileUrl ? String(payload.fileUrl).trim() : undefined,
    tags,
    collegeIds,
    metadata: normalizeMetadata(payload?.metadata),
  };

  return documentPayload;
};

export const serializeDocument = (doc: IApplicationDocument) => ({
  _id: doc._id.toString(),
  title: doc.title,
  category: doc.category,
  status: doc.status,
  description: doc.description || '',
  fileUrl: doc.fileUrl || '',
  tags: doc.tags || [],
  collegeIds: Array.isArray(doc.collegeIds) ? doc.collegeIds.map((id) => id.toString()) : [],
  metadata: doc.metadata
    ? {
        ...doc.metadata,
        testDate: doc.metadata.testDate ? doc.metadata.testDate.toISOString() : undefined,
      }
    : {},
  lastTouchedAt: doc.lastTouchedAt ? doc.lastTouchedAt.toISOString() : null,
  updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
  createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
});
