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
          lot_name: 'Tally Import 2026-01-15',
          fiber_composition: [
            { name: 'Organic Cotton Yarn', category: 'Yarn', fiber_type: 'natural', qty: 500 },
          ],
          supplier_name: 'Arvind Mills',
          supplier_state: 'Gujarat',
          total_gst: 5400,
          hsn_code: '5205',
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
      expect(screen.getByText('Organic Cotton Yarn')).toBeTruthy()
      expect(screen.getByText((content) => content.includes('Arvind Mills'))).toBeTruthy()
    })
  })

  it('calls onApply with draft data when user clicks Apply', async () => {
    const draft = {
      lot_name: 'Tally Import 2026-01-15',
      fiber_composition: [{ name: 'Polyester Fiber', category: 'Fiber', fiber_type: 'synthetic', qty: 200 }],
      supplier_name: 'Supplier A',
      supplier_state: 'GJ',
      total_gst: 2700,
      hsn_code: '5402',
    }
    mockPost.mockResolvedValueOnce({
      data: { draft, vouchers: 1, stock_items: 1 },
    })

    render(<TallyImportDialog open onOpenChange={() => {}} onApply={mockOnApply} />)

    const file = new File(['<ENVELOPE></ENVELOPE>'], 'tally.xml', { type: 'application/xml' })
    const input = screen.getByLabelText('Upload Tally XML')
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Apply to Lot Form')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('Apply to Lot Form'))
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
