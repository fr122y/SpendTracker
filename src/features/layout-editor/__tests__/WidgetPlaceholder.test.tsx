import { render, screen, fireEvent } from '@testing-library/react'

import { WidgetPlaceholder } from '../ui/widget-placeholder'

describe('WidgetPlaceholder', () => {
  it('renders children', () => {
    render(
      <WidgetPlaceholder
        columnId="col-1"
        widgetId="CALENDAR"
        onDrop={jest.fn()}
        isEditMode={false}
      >
        <div data-testid="widget-content">Calendar Widget</div>
      </WidgetPlaceholder>
    )

    expect(screen.getByTestId('widget-content')).toBeInTheDocument()
  })

  it('shows drag handle when in edit mode', () => {
    render(
      <WidgetPlaceholder
        columnId="col-1"
        widgetId="CALENDAR"
        onDrop={jest.fn()}
        isEditMode={true}
      >
        <div>Calendar Widget</div>
      </WidgetPlaceholder>
    )

    expect(screen.getByLabelText(/перетащить виджет/i)).toBeInTheDocument()
  })

  it('hides drag handle when not in edit mode', () => {
    render(
      <WidgetPlaceholder
        columnId="col-1"
        widgetId="CALENDAR"
        onDrop={jest.fn()}
        isEditMode={false}
      >
        <div>Calendar Widget</div>
      </WidgetPlaceholder>
    )

    expect(
      screen.queryByLabelText(/перетащить виджет/i)
    ).not.toBeInTheDocument()
  })

  it('has draggable container when in edit mode', () => {
    render(
      <WidgetPlaceholder
        columnId="col-1"
        widgetId="CALENDAR"
        onDrop={jest.fn()}
        isEditMode={true}
      >
        <div>Calendar Widget</div>
      </WidgetPlaceholder>
    )

    const placeholder = screen.getByTestId('widget-placeholder')
    expect(placeholder).toHaveAttribute('draggable', 'true')
  })

  it('is not draggable when not in edit mode', () => {
    render(
      <WidgetPlaceholder
        columnId="col-1"
        widgetId="CALENDAR"
        onDrop={jest.fn()}
        isEditMode={false}
      >
        <div>Calendar Widget</div>
      </WidgetPlaceholder>
    )

    const placeholder = screen.getByTestId('widget-placeholder')
    expect(placeholder).toHaveAttribute('draggable', 'false')
  })

  it('calls onDrop when a widget is dropped', () => {
    const onDrop = jest.fn()
    render(
      <WidgetPlaceholder
        columnId="col-1"
        widgetId="CALENDAR"
        onDrop={onDrop}
        isEditMode={true}
      >
        <div>Calendar Widget</div>
      </WidgetPlaceholder>
    )

    const placeholder = screen.getByTestId('widget-placeholder')

    const mockDataTransfer = {
      getData: jest.fn(() =>
        JSON.stringify({ widgetId: 'EXPENSE_LOG', fromColumnId: 'col-2' })
      ),
    }

    fireEvent.drop(placeholder, {
      dataTransfer: mockDataTransfer,
    })

    expect(onDrop).toHaveBeenCalledWith('EXPENSE_LOG', 'col-2', 'col-1')
  })

  it('highlights drop zone on drag over', () => {
    render(
      <WidgetPlaceholder
        columnId="col-1"
        widgetId="CALENDAR"
        onDrop={jest.fn()}
        isEditMode={true}
      >
        <div>Calendar Widget</div>
      </WidgetPlaceholder>
    )

    const placeholder = screen.getByTestId('widget-placeholder')

    fireEvent.dragOver(placeholder, {
      preventDefault: jest.fn(),
    })

    expect(placeholder).toHaveClass('ring-2')
  })
})
