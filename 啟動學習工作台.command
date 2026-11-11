#!/bin/zsh
cd "$(dirname "$0")"
echo "正在啟動 ESP32 互動式麵包板學習工作台..."
npm run dev -- --open
