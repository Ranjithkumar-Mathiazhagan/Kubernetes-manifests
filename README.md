# Microservices: Python + PostgreSQL <-> Node + MySQL

Two linked services orchestrated with Docker Compose:

- **python-service** (FastAPI + PostgreSQL) — "Users" service, port `8000`
- **node-service** (Express + MySQL) — "Orders" service, port `3000`

The Node service is linked to the Python service: before creating an order it
calls `GET http://python-service:8000/users/{id}` to verify the user exists.
If the user isn't found, the order is rejected. This happens over the Docker
Compose network using the service name `python-service` as the hostname.

## Run it

```bash
docker compose up --build
```

Wait for both databases to report healthy, then the services start.

## Try it

1. Create a user (Python + Postgres):

```bash
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Ada Lovelace", "email": "ada@example.com"}'
```

This returns something like `{"id": 1, "name": "Ada Lovelace", "email": "ada@example.com"}`.

2. Create an order for that user (Node + MySQL), which internally calls back
   to the Python service to validate `user_id`:

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "item": "Mechanical Keyboard", "quantity": 1}'
```

3. Try an order with a non-existent user to see the link enforce itself:

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"user_id": 999, "item": "Ghost Order", "quantity": 1}'
# -> 404 { "error": "User 999 does not exist in Users service" }
```

4. List orders / users:

```bash
curl http://localhost:3000/orders
curl http://localhost:8000/users
```

## Project layout

```
project/
├── docker-compose.yml
├── python-service/         # FastAPI + PostgreSQL (Users)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── database.py
│       ├── models.py
│       └── schemas.py
└── node-service/           # Express + MySQL (Orders)
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── index.js
        ├── db.js
        └── routes/orders.js
```

## Notes / next steps

- Credentials are hardcoded for local dev only — move them to a `.env` file
  and Docker secrets for anything beyond local testing.
- Both DBs auto-create their schema on service startup (SQLAlchemy
  `create_all` for Postgres, a `CREATE TABLE IF NOT EXISTS` for MySQL).
- To scale the link further, add a shared message broker (e.g. RabbitMQ or
  Kafka) instead of direct HTTP calls if you want async communication.
