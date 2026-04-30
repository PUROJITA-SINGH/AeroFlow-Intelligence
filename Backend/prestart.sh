#!/usr/bin/env sh
set -eu

echo "Running Alembic migrations..."
python -m alembic upgrade head
echo "Alembic migrations completed."

if [ "${SEED_ADMIN:-false}" = "true" ]; then
  echo "SEED_ADMIN=true; seeding initial users..."
  python seed_admin.py
  echo "Initial user seed completed."
else
  echo "SEED_ADMIN is not true; skipping initial user seed."
fi
