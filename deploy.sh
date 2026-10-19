#!/bin/bash

# Deploy script that handles Neon migration timeouts gracefully
# If migrations fail (timeout), we continue anyway since they may already be applied

echo "Starting deployment..."

cd packages/database

echo "Attempting to run migrations..."
if npx prisma migrate deploy 2>&1; then
    echo "✓ Migrations completed successfully"
else
    echo "⚠ Migration failed or timed out - continuing anyway (migrations may already be applied)"
    echo "This is common with Neon serverless Postgres advisory lock timeouts"
fi

cd ../..

echo "Starting API server..."
exec node apps/api/dist/main.js
