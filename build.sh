#!/usr/bin/env bash
set -e

cat > env.js <<'EOF'
window.process = {
  env: {
   SUPABASE_URL: "${SUPABASE_URL}",
    SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}"
  }
};
EOF
