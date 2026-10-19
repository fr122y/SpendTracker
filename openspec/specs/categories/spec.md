# categories Specification

## Purpose

Личные категории можно удалять с переносом их расходов в другую категорию, переименовывать, менять им эмодзи и цвет.

## Requirements

### Requirement: Delete a personal category with expense reassignment

При удалении личной категории система MUST перенести все личные операции пользователя с этой категорией (без общего бюджета, включая операции карманов и проектов) в выбранную пользователем категорию: имя и эмодзи операции MUST стать именем и эмодзи целевой категории. Перенос и удаление MUST выполняться атомарно. Правила автокатегоризации удаляемой категории MUST удаляться. Целевая категория MUST принадлежать пользователю и отличаться от удаляемой; последнюю оставшуюся категорию MUST NOT быть возможно удалить. Операции общих бюджетов и других пользователей MUST NOT изменяться.

#### Scenario: Confirm deletion of a category with expenses

- **GIVEN** в личной категории есть N операций
- **WHEN** пользователь нажимает «Удалить»
- **THEN** диалог показывает «В категории N операций. Куда перенести?», выбор целевой категории и предупреждение об удалении правил автокатегоризации
- **AND** по умолчанию выбрана «Другое», если она есть и не удаляется, иначе первая оставшаяся категория

#### Scenario: Reassign expenses on deletion

- **WHEN** пользователь подтверждает удаление с выбранной целевой категорией
- **THEN** категория удалена, её операции относятся к целевой категории
- **AND** «Анализ» не показывает плитку удалённой категории

#### Scenario: Delete an empty category

- **GIVEN** в категории нет операций
- **WHEN** пользователь нажимает «Удалить»
- **THEN** диалог показывает простое подтверждение без выбора целевой категории

#### Scenario: Reject invalid deletion

- **WHEN** целевая категория чужая, отсутствует или совпадает с удаляемой, или удаляется последняя категория
- **THEN** сервер отклоняет запрос и ничего не меняет
- **AND** кнопка удаления недоступна, когда осталась одна категория

### Requirement: Rename a category and change its emoji

Пользователь MUST иметь возможность переименовать личную категорию и категорию общего бюджета и сменить её эмодзи. Имя MUST обрезаться по краям, MUST NOT быть пустым и MUST быть уникальным без учёта регистра среди категорий пользователя (для общей категории — среди активных категорий её бюджета). Эмодзи MUST быть ровно одной графемой; ZWJ-эмодзи и флаги MUST NOT обрезаться. Переименование и смена эмодзи MUST атомарно переноситься на операции категории: для личной категории — на личные операции пользователя (без общего бюджета) со старым именем, для общей — на операции этой категории в её бюджете. Операции других пользователей и других бюджетов MUST NOT изменяться. Правила автокатегоризации MUST оставаться привязанными к категории.

#### Scenario: Rename a personal category

- **GIVEN** у пользователя есть личные операции в категории «Продукты»
- **WHEN** пользователь переименовывает её в «Еда»
- **THEN** категория и эти операции называются «Еда»
- **AND** операции общих бюджетов и других пользователей с именем «Продукты» не изменились
- **AND** правила автокатегоризации категории продолжают работать

#### Scenario: Reject an invalid rename

- **WHEN** новое имя пустое или совпадает без учёта регистра с другой категорией
- **THEN** изменение отклоняется, категория и операции не меняются

#### Scenario: Enter a ZWJ emoji

- **WHEN** пользователь вводит ZWJ-эмодзи вроде «👨‍👩‍👧» в поле эмодзи
- **THEN** эмодзи сохраняется целиком, а второе эмодзи в поле не помещается

### Requirement: Category color

Личная категория и категория общего бюджета MUST иметь необязательный цвет из фиксированной палитры. Без сохранённого цвета MUST показываться стабильный цвет палитры, выбранный по имени категории. Настройки категорий MUST предлагать выбор из образцов палитры и вариант «Автоматически»; произвольный hex MUST NOT приниматься.

#### Scenario: Pick a color

- **WHEN** пользователь редактирует категорию и выбирает цвет палитры
- **THEN** категория сохраняет этот цвет, а список категорий показывает его

#### Scenario: Automatic color

- **GIVEN** у категории нет сохранённого цвета
- **THEN** она показывается одним и тем же цветом палитры при каждом открытии

#### Scenario: Reject a color outside the palette

- **WHEN** сервер получает цвет не из палитры
- **THEN** изменение отклоняется

### Requirement: Distinct add-category labels

Формы добавления личной категории и категории общего бюджета MUST иметь различающиеся подписи полей и кнопок: «Добавить личную категорию» и «Добавить категорию общего бюджета».

#### Scenario: Switch between category kinds

- **WHEN** пользователь переключается между «Личные» и «Общие» в настройках категорий
- **THEN** поле названия и кнопка добавления подписаны для выбранного вида категорий

### Requirement: Limit the category name length

A personal or shared category name MUST NOT exceed 40 characters, counted as JavaScript string length after trimming. The name field MUST stop input at the limit and explain it. The server MUST reject a new or renamed category over the limit with the message «Название категории не длиннее 40 символов». A stored name over the limit MUST stay unchanged and MUST NOT block changing the emoji or color.

#### Scenario: Reject a 41-character name

- **WHEN** a client adds or renames a category to a 41-character name
- **THEN** the server rejects it with «Название категории не длиннее 40 символов»

#### Scenario: Recolor a legacy long category

- **GIVEN** a stored category with a 90-character name
- **WHEN** the user changes only its color
- **THEN** the color is saved and the name is unchanged

### Requirement: Show long category names in the category list

The category list MUST show as much of a category name as fits on one line, truncated with an ellipsis and with the full name as the element title. When the categories widget is wide, the edit and delete actions MUST sit beside the name and MUST NOT shrink; the name MUST take at least half of the remaining row width. When the widget is narrow, the actions MUST move to a compact row under the name, and the name MUST take at least half of the row width. The layout MUST follow the widget width (a container query), not the viewport width.

#### Scenario: Narrow categories widget on a desktop

- **GIVEN** the categories widget sits in a narrow dashboard column at 1280 px
- **AND** a category is named with 40 characters without spaces
- **WHEN** the category list is shown
- **THEN** «Изменить» and «Удалить» are under the name
- **AND** the name takes at least half of the row width
