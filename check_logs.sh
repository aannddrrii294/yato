#!/bin/bash
echo "=== DOCKER CONTAINERS STATUS ===" > backend_logs.txt
docker compose ps >> backend_logs.txt 2>&1
echo "" >> backend_logs.txt

echo "=== BACKEND RECENT LOGS ===" >> backend_logs.txt
docker compose logs --tail=100 backend >> backend_logs.txt 2>&1
echo "" >> backend_logs.txt

echo "=== POSTGRES RECENT LOGS ===" >> backend_logs.txt
docker compose logs --tail=100 postgres >> backend_logs.txt 2>&1
echo "" >> backend_logs.txt

echo "=== REDIS RECENT LOGS ===" >> backend_logs.txt
docker compose logs --tail=50 redis >> backend_logs.txt 2>&1
echo "" >> backend_logs.txt

echo "=== PRISMA DB PUSH DRY RUN / STATUS ===" >> backend_logs.txt
docker compose exec -T backend npx prisma db pull >> backend_logs.txt 2>&1

echo "Diagnosis complete. Output saved to backend_logs.txt."
