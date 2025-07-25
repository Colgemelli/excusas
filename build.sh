#!/usr/bin/env bash
set -e

# Ensure environment variables are set
: "${SUPABASE_URL:?SUPABASE_URL not set}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY not set}"

cat > env.js <<EOF
window.process = {
  env: {
    SUPABASE_URL: "${SUPABASE_URL}",
    SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}"
  }
};
EOF

echo "env.js generado"
