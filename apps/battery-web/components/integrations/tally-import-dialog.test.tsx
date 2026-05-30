import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TallyImportDialog from './tally-import-dialog'

const mockOnApply = vi.fn()

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

import api from '@/lib/api'
const mockPost = api.post as unknown as ReturnType<typeof vi.fn>

describe('TallyImportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload zone when open', () => {
    render(<TallyImportDialog open onOpenChange={() => {}} onApply={mockOnApply} />)
    expect(screen.getByText('Import from Tally ERP')).toBeTruthy()
    expect(screen.getByText('Drag & drop your Tally XML export')).toBeTruthy()
  })

  it('shows parsed preview after successful upload', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        draft: {
          batch_name: 'Tally Import 2026-01-15',
          material_composition: [
            { name: 'LFP Cell 3.2V', category: 'Battery Cells', chemistry: 'LFP', qty: 100 },
          ],
          supplier_name: 'Amara Raja Cells Ltd',
          supplier_state: 'Tamil Nadu',
          total_gst: 2700,
          hsn_code: '8507',
        },
        vouchers: 1,
        stock_items: 1,
      },
    })

    render(<TallyImportDialog open onOpenChange={() => {}} onApply={mockOnApply} />)

    const file = new File(['<ENVELOPE></ENVELOPE>'], 'tally.xml', { type: 'application/xml' })
    const input = screen.getByLabelText('Upload Tally XML')
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('LFP Cell 3.2V')).toBeTruthy()
      expect(screen.getByText((content) => content.includes('Amara Raja Cells Ltd'))).toBeTruthy()
    })
  })

  it('calls onApply with draft data when user clicks Apply', async () => {
    const draft = {
      batch_name: 'Tally Import 2026-01-15',
      material_composition: [{ name: 'LFP Cell', category: 'Cells', chemistry: 'LFP', qty: 100 }],
      supplier_name: 'Supplier A',
      supplier_state: 'TN',
      total_gst: 2700,
      hsn_code: '8507',
    }
    mockPost.mockResolvedValueOnce({
      data: { draft, vouchers: 1, stock_items: 1 },
    })

    render(<TallyImportDialog open onOpenChange={() => {}} onApply={mockOnApply} />)

    const file = new File(['<ENVELOPE></ENVELOPE>'], 'tally.xml', { type: 'application/xml' })
    const input = screen.getByLabelText('Upload Tally XML')
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Apply to Batch Form')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('Apply to Batch Form'))
    expect(mockOnApply).toHaveBeenCalledWith(draft)
  })

  it('shows error on failed upload', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { error: 'Invalid XML format' } },
    })

    render(<TallyImportDialog open onOpenChange={() => {}} onApply={mockOnApply} />)

    const file = new File(['not xml'], 'tally.xml', { type: 'application/xml' })
    const input = screen.getByLabelText('Upload Tally XML')
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Import Failed')).toBeTruthy()
    })
  })
})
