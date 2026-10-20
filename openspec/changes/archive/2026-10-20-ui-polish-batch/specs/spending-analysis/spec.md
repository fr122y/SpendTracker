# Spec Delta

## ADDED Requirements

### Requirement: Label pocket purchases in category details

In the expense list of a category in «Анализ», a purchase paid from a pocket MUST be labelled «Покупка из кармана», not «Личный расход».

#### Scenario: Pocket purchase in details

- **GIVEN** a category holds a purchase from a pocket
- **WHEN** the user opens the category details
- **THEN** the purchase is labelled «Покупка из кармана»
