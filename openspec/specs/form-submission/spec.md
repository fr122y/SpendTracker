# Form Submission Specification

## Purpose

Гарантирует, что повторные нажатия и отправки форм создания до завершения первого запроса порождают одну запись, а повтор операции с тем же client id не создаёт дубликат.

## Requirements

### Requirement: Submit a create form once per action

Формы создания кармана, переименования кармана, операции в журнале расходов, покупки и перевода кармана, расхода проекта, проекта, личной и общей категории MUST отправлять один запрос, когда отправка срабатывает несколько раз подряд до завершения первого запроса, в том числе до перерисовки формы. После завершения запроса, успешного или нет, форму MUST можно отправить снова.

#### Scenario: Triple click on create

- **WHEN** пользователь трижды быстро нажимает «Создать карман» с заполненным именем
- **THEN** отправляется один запрос, и создаётся один карман

#### Scenario: Repeated submit while a mapping is saved

- **GIVEN** форма журнала сохраняет ручной выбор категории перед добавлением операции
- **WHEN** пользователь несколько раз подряд отправляет форму
- **THEN** на сервере создаётся одна операция

#### Scenario: Submit again after a failure

- **GIVEN** запрос отправки завершился ошибкой
- **WHEN** пользователь отправляет форму снова
- **THEN** отправляется новый запрос

### Requirement: Create an operation at most once per client id

Создание операции MUST принимать необязательный идентификатор, созданный клиентом. Повторный запрос с тем же идентификатором от того же пользователя MUST NOT создавать вторую операцию и MUST завершаться успешно. Идентификатор операции другого пользователя MUST отклоняться без записи. Повтор после сбоя в форме операции кармана MUST использовать тот же идентификатор, пока пользователь не изменил поля.

#### Scenario: Retry an operation that was already stored

- **GIVEN** операция с идентификатором клиента сохранена, но ответ до клиента не дошёл
- **WHEN** клиент повторяет запрос с тем же идентификатором
- **THEN** сервер отвечает успехом, и операция хранится один раз

#### Scenario: Reject another user's id

- **GIVEN** операция с этим идентификатором принадлежит другому пользователю
- **WHEN** клиент создаёт операцию с этим идентификатором
- **THEN** операция не создаётся

### Requirement: Run operations on a record after it is saved

An operation on a record whose create request has not finished yet (delete, edit, archive, selection, a child operation, or a new record that refers to it) MUST be shown at once and MUST reach the server only after the create request returns, with the stored id. The user MUST NOT need to wait or retry. No request MUST carry a temporary `temp-` id; a server action that still receives one MUST NOT answer with a server error. If the create request fails, the record MUST be rolled back with one error toast, and the waiting operations MUST be dropped without a second toast.

#### Scenario: Delete an expense right after adding it

- **GIVEN** the user added «Обед» and the create request is still running
- **WHEN** the user deletes «Обед» and the undo window passes
- **THEN** the delete reaches the server after the create
- **AND** after a reload «Обед» is not in the journal

#### Scenario: Rename a category before it is saved

- **GIVEN** a new category is shown but its create request is still running
- **WHEN** the user renames it
- **THEN** the rename is sent with the stored id after the create returns

#### Scenario: The create fails

- **GIVEN** an operation waits for a record that is still being created
- **WHEN** the create request fails
- **THEN** the record disappears with one error toast and the waiting operation is not sent

#### Scenario: A temporary id reaches the server

- **WHEN** a server action receives an id starting with `temp-`
- **THEN** it answers without a server error and changes nothing
