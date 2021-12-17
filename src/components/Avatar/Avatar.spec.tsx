import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

import { Clan, Custom, Empty, Member } from './Avatar.stories'

describe('Components/Avatar', () => {
  describe('Empty', () => {
    it('should output the expected markup with no props', () => {
      render(<Empty />)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })

  describe('Member', () => {
    it('should output the expected markup for a member', () => {
      render(<Member {...Member.args} />)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })

  describe('Clan', () => {
    it('should render the expected markup for a clan', () => {
      const { container } = render(<Clan {...Clan.args} />)

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      expect(
        container.querySelector(`[id="${Clan.args.id}-bg"]`)
      ).toBeInTheDocument()
      expect(
        container.querySelector(`[id="${Clan.args.id}-fg"]`)
      ).toBeInTheDocument()
    })
  })

  describe('Custom', () => {
    it('should output the expected markup when `children` prop passed', async () => {
      const { container } = render(<Custom {...Custom.args} />)

      await waitFor(() => container.querySelector('svg'))

      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })
})
