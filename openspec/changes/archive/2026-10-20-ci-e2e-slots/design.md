# Design

## Выбор slot

Job `slot` запрашивает `GET /repos/{repo}/commits/{sha}/pulls`, берёт открытый Pull Request, у которого head равен deployed commit, иначе первый открытый; номер mod 3 — slot. Нет Pull Request — slot 0. Детерминированно: все commits одного Pull Request попадают в один slot, поэтому два run одного аккаунта не пересекаются.

## Concurrency на уровне job

Документация GitHub (workflow syntax, `jobs.<job_id>.concurrency`): выражение группы может использовать контексты `github`, `inputs`, `vars`, `needs`, `strategy`, `matrix`. Поэтому группа `e2e-preview-slot-${{ needs.slot.outputs.slot }}` вычисляется из output первого job. Workflow-level concurrency так не умеет (только `github`, `inputs`, `vars`), а `github.event.deployment` не содержит номера Pull Request — альтернативы (reusable workflow, slot из SHA) не нужны.

`cancel-in-progress: false`: запущенный run не отменяется. `queue: max` (до 100 pending в группе) убирает отмену pending run другого Pull Request, которую давал `queue: single`. Run устаревшего commit по-прежнему выходит рано на шаге `Skip a superseded commit`, так что лишние run в очереди стоят секунды.

## Credentials

Шаги `Require e2e secrets` и `Run e2e tests` читают `secrets[format('E2E_USER_EMAIL{0}', needs.slot.outputs.suffix)]` (суффикс пустой или `_SLOT<n>`). Пустое значение не подменяется secrets slot 0: проверка падает с именем отсутствующего secret и номером slot. В job `e2e` попадают только secrets своего slot.

## Какая версия workflow выполняется

Для `deployment_status` GitHub берёт `GITHUB_SHA`/`GITHUB_REF` из deployment, и workflow читается из deployed commit (это уже зафиксировано в комментарии workflow). Pull Request с этим изменением сам выполняет новую схему.
