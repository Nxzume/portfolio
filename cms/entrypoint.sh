#!/bin/sh

echo "=== CMS migrate starting ==="
node migrate.mjs
code=$?
echo "=== CMS migrate finished (exit $code) ==="

if [ "$code" -ne 0 ]; then
  exit "$code"
fi

# Stay running so Coolify keeps logs visible in the Logs tab.
echo "=== Migrate succeeded — container staying alive for logs ==="
exec tail -f /dev/null
