# Claude Code Instructions

## Git Commits

При создании коммитов:

1. **Детальное описание** — описывай что было сделано в формате:
   - Заголовок: краткое описание (feat/fix/refactor/chore: ...)
   - Тело: список изменений с `-`

2. **Без атрибуции** — НЕ добавляй в коммиты:
   - `🤖 Generated with [Claude Code]`
   - `Co-Authored-By: Claude`
   - Любые другие упоминания о генерации с помощью AI

Пример правильного коммита:
```
feat: Add user authentication

- Implement JWT token generation
- Add login/logout endpoints
- Create auth middleware
- Add password hashing with bcrypt
```
