#!/bin/bash

# =============================================================================
# Скрипт настройки itermocil для CRM проекта
# =============================================================================
# Только для macOS + iTerm2
#
# Требования:
#   - macOS
#   - iTerm2 (https://iterm2.com)
#   - itermocil (gem install itermocil)
#
# Скрипт создаёт конфигурацию itermocil для быстрого запуска рабочего
# окружения CRM с тремя панелями: два Claude агента и dev сервер.
# =============================================================================

# Создаём директорию для itermocil если её нет
mkdir -p ~/.itermocil

# Создаём itermocil файл
cat > ~/.itermocil/crm.yml << 'EOF'
windows:
  - name: pane-less
    root: /Users/m/a/crm
    layout: even-horizontal
    panes:
      - claude --dangerously-skip-permissions
      - claude --dangerously-skip-permissions
      - docker start mongodb && npm run dev
EOF

echo "✓ Создан файл ~/.itermocil/crm.yml"

# Проверяем наличие alias в .zshrc
if grep -q "alias crm=" ~/.zshrc 2>/dev/null; then
    echo "✓ Alias 'crm' уже существует в ~/.zshrc"
else
    echo "" >> ~/.zshrc
    echo "# CRM itermocil alias" >> ~/.zshrc
    echo "alias crm='itermocil crm'" >> ~/.zshrc
    echo "✓ Добавлен alias 'crm' в ~/.zshrc"
    echo "  Выполните 'source ~/.zshrc' или перезапустите терминал"
fi
