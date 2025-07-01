#!/bin/bash
set -euo pipefail

: "${SUPABASE_URL:?SUPABASE_URL not set}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY not set}"

cat > env.js <<'EOF'
window.process = {
  env: {
   SUPABASE_URL: "${SUPABASE_URL}",
    SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}"
  }
};
EOL

echo "env.js generado"
exit 0
