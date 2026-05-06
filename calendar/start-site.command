#!/bin/zsh

cd "$(dirname "$0")"

PORT=3000
URL="http://localhost:3000"

echo "Открываю папку сайта:"
pwd
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "Ошибка: Node.js не найден."
  echo "Установи Node.js и перезапусти VS Code."
  read "?Нажми Enter, чтобы закрыть окно..."
  exit 1
fi

EXISTING_PID=$(lsof -ti tcp:$PORT -sTCP:LISTEN)

if [ -n "$EXISTING_PID" ]; then
  echo "Сервер уже запущен на порту $PORT."
  echo "Открываю сайт..."
  open "$URL"
  echo ""
  echo "Можно закрыть это окно."
  read "?Нажми Enter, чтобы закрыть окно..."
  exit 0
fi

echo "Запускаю сервер..."
node server.js &

SERVER_PID=$!

sleep 1

echo ""
echo "Открываю сайт..."
open "$URL"

echo ""
echo "Сервер работает."
echo "Адрес сайта: $URL"
echo ""
echo "Не закрывай это окно, пока работаешь с сайтом."
echo "Чтобы остановить сервер, нажми Control + C."
echo ""

trap "kill $SERVER_PID 2>/dev/null; exit" INT TERM EXIT

wait $SERVER_PID