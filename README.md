# HumanArtArchive
## Setup
Create the following files:

db/.env
```bash
WEB_USER=admin
WEB_PASSWORD=your-safe-password
JWT_SECRET=your-safe-secret
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=db
POSTGRES_USER=user
POSTGRES_PASSWORD=your-safe-password
```

## Running the app
```bash
docker compose -f docker-compose.prod.yml up --build 
docker exec -it back node auth/seed-admin.js #(First time only, creates admin account)

docker compose -f docker-compose.prod.yml down
```