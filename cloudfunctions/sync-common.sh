#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"
COMMON="$ROOT/common"

sync_lib() {
  local func=$1
  shift
  mkdir -p "$ROOT/$func/lib"
  for file in "$@"; do
    cp "$COMMON/$file" "$ROOT/$func/lib/"
  done
}

sync_lib createReport \
  deepseek.js reportEngine.js jsonParser.js promptService.js userQuota.js quotaConfig.js

sync_lib getReport reportEngine.js jsonParser.js
sync_lib initReportTemplates reportEngine.js promptService.js templates.js

echo "common 模块已同步到 createReport/getReport/initReportTemplates"
