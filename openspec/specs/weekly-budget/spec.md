# weekly-budget Specification

## Purpose

Виджет недельного бюджета показывает реальные суммы недели относительно эффективного лимита и позволяет задать личный недельный лимит для недели пользователя.

## Requirements

### Requirement: Show real weekly spending against the effective limit

The weekly budget summary MUST show the real amount spent in the week, not capped at the limit, against the effective limit: the base weekly limit plus same-week project withdrawals and pocket transfers. When top-ups exist, the summary MUST show the base limit and the top-up amount that form the effective limit. Within budget, the summary MUST show «Осталось» as the effective limit minus spent. Over budget, the summary MUST show one line «Сверх бюджета» with spent minus the effective limit and MUST NOT show a negative «Осталось». Project and pocket top-up metrics MUST be shown only when that top-up is greater than zero, together with the part of it used to cover overspending.

#### Scenario: Overspending without top-ups

- **GIVEN** the weekly limit is 4 000 ₽ and 4 760,5 ₽ is spent in the week
- **WHEN** the weekly budget is shown
- **THEN** the summary shows «4 760,5 ₽ / 4 000 ₽»
- **AND** one line «Сверх бюджета: 760,5 ₽» is shown and «Осталось» is not

#### Scenario: Remaining explained by top-ups

- **GIVEN** the weekly limit is 8 000 ₽, top-ups in the week total 1 500 ₽ and 6 134,5 ₽ is spent
- **WHEN** the weekly budget is shown
- **THEN** the summary shows «6 134,5 ₽ / 9 500 ₽» and «Лимит 8 000 ₽ + пополнения 1 500 ₽»
- **AND** «Осталось: 3 365,5 ₽» is shown

#### Scenario: No top-ups

- **GIVEN** the week has no project withdrawals and no pocket transfers
- **WHEN** the weekly budget is shown
- **THEN** no project or pocket top-up metric is shown

### Requirement: Accept only a positive personal weekly limit for the user's week

The personal weekly limit MUST be greater than zero. The form MUST reject 0 and negative values with the inline error «Лимит должен быть больше 0» and MUST NOT save them; the server MUST reject them as well. The week a new limit applies to MUST be the Monday of the selected date in the user's local calendar, sent by the client as `YYYY-MM-DD`; the server MUST reject a value that is not a real date in that format or is not a Monday, and MUST NOT derive the week from its own clock. The same rule MUST apply to a shared budget limit, both on creation and on edit: the form MUST show the same inline error and MUST NOT save, and the server MUST reject a zero, negative or non-finite shared limit before any write. The «Лимит» label MUST be associated with its input.

#### Scenario: Zero limit

- **GIVEN** the weekly budget is shown
- **WHEN** the user enters 0 as the limit and confirms
- **THEN** the error «Лимит должен быть больше 0» is shown and the limit is not saved

#### Scenario: Monday morning ahead of UTC

- **GIVEN** the user is in UTC+10 and it is Monday 08:00 local time (Sunday in UTC)
- **WHEN** the user sets a new weekly limit
- **THEN** the limit applies from that local Monday

#### Scenario: Zero or negative shared budget limit

- **GIVEN** the user creates a shared budget or edits the active shared budget's weekly limit
- **WHEN** the user enters 0 or a negative limit
- **THEN** the error «Лимит должен быть больше 0» is shown and nothing is saved
- **AND** the server rejects such a limit before any write

#### Scenario: Week start is not a Monday

- **WHEN** the server receives a weekly limit for a week start that is not a Monday in `YYYY-MM-DD`
- **THEN** the request is rejected and nothing is stored
