$env:DATABASE_URL = "postgresql://postgres.ysbtlokyakbvivqlnyyz:uT%2CS4k44%24Ur.Qt%25@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
migrate -path ./backend/internal/db/migrations -database "$env:DATABASE_URL" -verbose up
