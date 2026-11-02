import { Batch } from '@/types';

// In-memory persistent demo store for immediate execution with full database fallback
let mockBatches: Batch[] = [
  {
    id: 'b1-java-mastery',
    tenant_id: 't-default',
    name: 'Java Full Stack & DSA Spring 2026',
    code: 'JAVA2026',
    description: 'Data structures, Algorithms, Spring Boot microservices and system design.',
    status: 'active',
    starts_at: '2026-01-10T00:00:00Z',
    ends_at: '2026-06-30T00:00:00Z',
    created_by: 'trainer-1',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'b2-python-ai',
    tenant_id: 't-default',
    name: 'Python for AI & Placement Prep',
    code: 'PYAI2026',
    description: 'Core Python, algorithmic puzzles, mock interview tracks, and assessment drilling.',
    status: 'active',
    starts_at: '2026-02-01T00:00:00Z',
    ends_at: '2026-07-31T00:00:00Z',
    created_by: 'trainer-1',
    created_at: '2026-01-15T00:00:00Z',
  },
];

export async function getBatchesByTenant(tenantId: string): Promise<Batch[]> {
  return mockBatches.filter((b) => b.tenant_id === tenantId || tenantId === 'all');
}

export async function createBatch(data: Omit<Batch, 'id' | 'created_at'>): Promise<Batch> {
  const newBatch: Batch = {
    ...data,
    id: `b-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  mockBatches.unshift(newBatch);
  return newBatch;
}
