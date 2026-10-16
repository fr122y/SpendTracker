import { fireEvent, render, screen } from '@testing-library/react'

import { LayoutVisibilityPanel } from '../ui/layout-visibility-panel'

describe('LayoutVisibilityPanel', () => {
  it('lists hidden widgets and shows one on click', () => {
    const onShow = jest.fn()
    render(
      <LayoutVisibilityPanel
        hiddenWidgets={[{ id: 'ANALYSIS', title: 'Анализ' }]}
        onShow={onShow}
        onReset={jest.fn()}
      />
    )
    expect(screen.getByText('Скрытые виджеты')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Показать: Анализ' }))
    expect(onShow).toHaveBeenCalledWith('ANALYSIS')
  })

  it('resets only after confirmation', () => {
    const onReset = jest.fn()
    render(
      <LayoutVisibilityPanel
        hiddenWidgets={[]}
        onShow={jest.fn()}
        onReset={onReset}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить раскладку' }))
    expect(onReset).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить' }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
