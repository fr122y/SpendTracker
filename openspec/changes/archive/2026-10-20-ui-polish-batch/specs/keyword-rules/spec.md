# Spec Delta

## ADDED Requirements

### Requirement: Show a loading state for the rule count

While the auto-categorization rules are loading, the category list MUST show a placeholder instead of a rule count, so a count of `0` is never shown for rules that are not loaded yet.

#### Scenario: Rules still loading

- **WHEN** the category list opens before the rules have loaded
- **THEN** each category shows a placeholder and no «Правила категории …: 0»
