import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TextileExportsPage from './textile-exports-page'

// Mock the exports API
vi.mock('@/lib/api/exports', () => ({
  listExportJobs: vi.fn(),
  refreshExportDownload: vi.fn(),
  formatFileSize: vi.fn((bytes?: number) => bytes ? `${bytes} B` : '-'),
  formatJobType: vi.fn((type: string) => type),
}))

import { listExportJobs } from '@/lib/api/exports'

const mockListExportJobs = listExportJobs as unknown as ReturnType<typeof vi.fn>

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('TextileExportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    mockListExportJobs.mockResolvedValueOnce({ jobs: [], total: 0 })
    render(<TextileExportsPage />, { wrapper })
    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('renders empty state when no exports', async () => {
    mockListExportJobs.mockResolvedValueOnce({ jobs: [], total: 0 })
    render(<TextileExportsPage />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('No exports yet')).toBeTruthy()
    })
  })

  it('renders export jobs and calls listExportJobs', async () => {
    mockListExportJobs.mockResolvedValueOnce({
      jobs: [
        {
          id: '1',
          batch_id: 'b1',
          batch_name: 'Lot A',
          job_type: 'CSV',
          status: 'COMPLETED',
          passport_count: 100,
          file_size_bytes: 1024,
          download_url: 'https://example.com/download',
          requested_at: '2024-01-01T00:00:00Z',
          download_count: 0,
        },
      ],
      total: 1,
    })
    render(<TextileExportsPage />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('Lot A')).toBeTruthy()
      expect(screen.getByText('Completed')).toBeTruthy()
    })
    expect(mockListExportJobs).toHaveBeenCalledWith(10, 0)
  })
})
