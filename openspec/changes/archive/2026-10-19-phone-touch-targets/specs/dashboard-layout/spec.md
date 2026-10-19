# Spec Delta

## ADDED Requirements

### Requirement: Phone touch targets are at least 44 px

On a phone viewport every interactive dashboard element MUST have a hit box of at least 44×44 px. Wide viewports MAY keep their compact sizes.

#### Scenario: Header month picker on a phone

- **GIVEN** a 375×667 viewport showing the dashboard
- **WHEN** the header month picker, filter chips, payday legend, calendar days and journal fields are measured
- **THEN** each box is at least 44 px wide and 44 px high
