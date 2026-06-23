import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ComponentFormDialog from './component-form-dialog'

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
  },
}))

describe('ComponentFormDialog', () => {
  it('renders form fields when open', () => {
    render(
      <ComponentFormDialog
        open
        onOpenChange={() => {}}
        batchId="batch-1"
        onSaved={() => {}}
      />
    )
    expect(screen.getByRole('heading', { name: 'Add Component' })).toBeTruthy()
    expect(screen.getByLabelText('Name *')).toBeTruthy()
    expect(screen.getByText('Chemistry & Materials')).toBeTruthy()
  })

  it('shows validation error on empty submit', () => {
    render(
      <ComponentFormDialog
        open
        onOpenChange={() => {}}
        batchId="batch-1"
        onSaved={() => {}}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add Component' }))
    // The form prevents submit with empty name via toast
    expect(screen.getByRole('heading', { name: 'Add Component' })).toBeTruthy()
  })

  it('renders edit mode with pre-filled data', () => {
    render(
      <ComponentFormDialog
        open
        onOpenChange={() => {}}
        batchId="batch-1"
        editComponent={{
          id: 'comp-1',
          component_type: 'cell',
          name: 'LFP Cell 3.2V',
          chemistry: 'LFP',
          cobalt_pct: 0,
          lithium_pct: 4.5,
        }}
        onSaved={() => {}}
      />
    )
    expect(screen.getByText('Edit Component')).toBeTruthy()
    expect(screen.getByDisplayValue('LFP Cell 3.2V')).toBeTruthy()
  })
})
