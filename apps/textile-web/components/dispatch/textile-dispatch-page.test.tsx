import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TextileDispatchPage from './textile-dispatch-page'

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

describe('TextileDispatchPage', () => {
  it('renders dispatch header', () => {
    render(<TextileDispatchPage />)
    expect(screen.getByText('Lot Dispatch')).toBeTruthy()
    expect(screen.getByText('Scan lot QR codes to record shipments and track dispatch status')).toBeTruthy()
  })

  it('renders scan input field', () => {
    render(<TextileDispatchPage />)
    expect(screen.getByPlaceholderText('Scan or enter lot serial number...')).toBeTruthy()
  })
})
