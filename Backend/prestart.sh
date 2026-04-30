#!/usr/bin/env sh
set -eu

echo "Running Alembic migrations..."
python -m alembic upgrade head
echo "Alembic migrations completed."
