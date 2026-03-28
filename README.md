# File Upload API

A backend service for **secure file storage** with versioning, deduplication, and shareable access tokens. Built with Node.js, Express, PostgreSQL (Prisma), and S3-compatible object storage.

---

## Features

- **Versioning** — uploads create new versions instead of overwriting; the latest version pointer enables fast retrieval without expensive ORDER BY queries
- **Deduplication** — SHA-256 content hashing rejects uploads that match the latest stored version
- **Shareable tokens** — public files get share tokens for version-specific access via `GET /files/version/:token`
- **Streaming downloads** — files stream directly from S3, keeping memory usage low
- **Deferred deletion** — deleted files are queued for background cleanup, keeping API responses fast and preventing inconsistent state on failure

---

## Architecture

```
Client → Routes → Controllers → Services → Database (Prisma)
                                         └→ Storage (S3)
```

Deletion pipeline:

```
DELETE request → DB transaction → pendingDelete queue → Background worker → S3
```

The background worker runs every **15 seconds**, processing up to 50 deletions per cycle.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/files` | Upload a new file (`multipart/form-data`: `file`, `isPrivate`) |
| `GET` | `/files/:filename` | Stream the latest version |
| `PUT` | `/files/:filename` | Upload a new version (rejects duplicates) |
| `GET` | `/files/version/:token` | Stream a specific version via share token |
| `DELETE` | `/files/:filename/latest` | Delete latest version (removes file record if none remain) |
| `DELETE` | `/files/:filename` | Delete all versions and queue storage cleanup |

---

## Setup

```bash
git clone https://github.com/<your-username>/fileUploadAPI.git
npm install
cp .env.example .env       # fill in values below
npx prisma migrate dev
npm run dev
```

**Environment variables:**

```env
PORT=
DATABASE_URL=
JWT_SECRET=
AWS_ACCESS_KEY=
AWS_SECRET_KEY=
AWS_BUCKET=
AWS_REGION=
```

**Run tests:** `npm run test`

**Run with Docker:** `docker compose up --build`

---

## Project Structure

```
src/
├── config/          # Prisma, Multer, credentials
├── controllers/     # HTTP request/response handling
├── services/        # Business logic (versioning, deduplication, transactions)
├── routes/
├── helpers/         # Hashing, tokens, error handling
├── middleware/       # Auth, rate limiting, input validation
├── storage/         # S3 abstraction layer
├── utils/
└── tests/
```

---

## Future Improvements

- Chunked uploads for large files
- File access permissions
- Folder hierarchy support
- CDN integration
- Background job queue (BullMQ / Redis)

---

## License

MIT