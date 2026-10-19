## MODIFIED Requirements

### Requirement: Group spending by category

The analysis MUST combine included expenses with the same category, show each category's share of the included total as a percentage, and order categories by amount from highest to lowest. Each category tile MUST be filled with its category's color: the stored color, or the stable palette color chosen by the category name when none is stored. When a tile has personal or project-linked spending, the personal category's color MUST be used; otherwise the shared-budget category's color. The tile MUST show the expense scopes it contains (`Личные`, `Общие`, `Проекты`) as a small text label instead of a scope color, and its text MUST stay readable on every palette color.

#### Scenario: Combine category amounts

- GIVEN the selected month and scope include multiple expenses in one category
- WHEN category statistics are calculated
- THEN their amounts contribute to one category total
- AND the category percentage is based on the total for the selected scope
- AND categories are ordered by descending amount

#### Scenario: Color a tile by its category

- GIVEN a category with a stored color has spending in the selected month
- WHEN the analysis is rendered
- THEN the category tile is filled with that color
- AND the tile label names the scopes of its expenses

#### Scenario: Color a tile without a stored color

- GIVEN a category without a stored color has spending in the selected month
- WHEN the analysis is rendered
- THEN the tile is filled with the palette color chosen by the category name
