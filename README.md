# File API

A backend service for managing file uploads, retrieval, and metadata storage.
This API provides endpoints to upload files, retrieve them, and maintain metadata in a database. It is designed to be simple, scalable, and easy to integrate with frontend or other backend services.

---

## Features

* Upload files to the server
* Retrieve files using unique ide ntifiers
* Store file metadata in a database
* Delete files when no longer needed
* Efficient handling of file storage and access
* Clean REST API design

---

## Tech Stack

* **Node.js**
* **TypeScript**
* **Express**
* **Prisma ORM**
* **PostgreSQL**
* **Multer** (for file uploads)

---

## Project Structure

```

src
│
├── config
│   ├── creds.ts
│   ├── multerConfig.ts
│   └── prismaClient.ts
│
├── controllers
│   └── Handles incoming HTTP requests
│
├── services
│   └── Business logic for file operations
│
├── routes
│   └── API route definitions
│
├── middleware
│   └── Custom middleware (validation, error handling)
│
├── helpers
│   └── Utility helpers for processing file logic
│
├── storage
│   └── Local file storage logic
│
├── utils
│   └── Common utility functions
│
└── server.ts

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd file-api
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the root directory.

Example:

```
DATABASE_URL="postgresql://username:password@localhost:5432/fileapi"
PORT=3000
```

---

## Running the Server

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

---

## API Endpoints

### Upload File

```
POST /files/upload
```

Uploads a new file.

**Request**

```
multipart/form-data
file: <file>
```

**Response**

```json
{
  "fileId": "12345",
  "fileName": "example.png",
  "url": "/files/12345"
}
```

---

### Get File

```
GET /files/:fileId
```

Returns the requested file.

---

### Get File Metadata

```
GET /files/:fileId/meta
```

Returns stored metadata for the file.

**Response**

```json
{
  "id": "12345",
  "name": "example.png",
  "size": 1048576,
  "uploadedAt": "2026-03-15T10:30:00Z"
}
```

---

### Delete File

```
DELETE /files/:fileId
```

Deletes the file and its metadata.

---

## Database Schema (Example)

```
model File {
  id          String   @id @default(uuid())
  name        String
  path        String
  size        Int
  uploadedAt  DateTime @default(now())
}
```

---

## Error Handling

The API returns standard HTTP status codes:

| Status | Meaning               |
| ------ | --------------------- |
| 200    | Success               |
| 400    | Bad Request           |
| 404    | File Not Found        |
| 500    | Internal Server Error |

---

## Future Improvements

* File access permissions
* Cloud storage integration (AWS S3 / GCP)
* File versioning
* Chunked uploads for large files
* CDN integration

---

## License

MIT License
