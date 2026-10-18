# QuickNotes API design

The QuickNotes service exposes a versioned JSON REST API. Authentication uses
Bearer access tokens, and note ownership is determined from the authenticated
user rather than from a client-supplied `userId`.

## Endpoints

| Method | Path | Description | Success |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Create a user account | `201 Created` |
| POST | `/api/v1/auth/login` | Authenticate and return access tokens | `200 OK` |
| GET | `/api/v1/notes` | List the authenticated user's notes, with pagination and search | `200 OK` |
| POST | `/api/v1/notes` | Create a note for the authenticated user | `201 Created` |
| GET | `/api/v1/notes/{noteId}` | Retrieve one note owned by the authenticated user | `200 OK` |
| PATCH | `/api/v1/notes/{noteId}` | Update selected note fields | `200 OK` |
| DELETE | `/api/v1/notes/{noteId}` | Delete a note | `204 No Content` |
| GET | `/api/v1/tags` | List tags used by the authenticated user | `200 OK` |
| POST | `/api/v1/notes/{noteId}/tags/{tagId}` | Attach an existing tag to a note | `204 No Content` |

List requests support `limit`, `cursor`, and `q` query parameters. Responses
include `nextCursor` when another page is available.

## Create a note

Request:

```http
POST /api/v1/notes HTTP/1.1
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "title": "Plan weekend hike",
  "body": "Pack water, snacks and a rain jacket.",
  "tagIds": [3, 8]
}
```

Response:

```http
HTTP/1.1 201 Created
Location: /api/v1/notes/981
Content-Type: application/json

{
  "id": 981,
  "title": "Plan weekend hike",
  "body": "Pack water, snacks and a rain jacket.",
  "userId": 42,
  "tags": [
    { "id": 3, "name": "personal" },
    { "id": 8, "name": "outdoors" }
  ],
  "createdAt": "2026-10-18T16:20:00Z",
  "updatedAt": "2026-10-18T16:20:00Z"
}
```

## List notes

Request:

```http
GET /api/v1/notes?limit=2&q=hike HTTP/1.1
Authorization: Bearer <access-token>
```

Response:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "items": [
    {
      "id": 981,
      "title": "Plan weekend hike",
      "body": "Pack water, snacks and a rain jacket.",
      "userId": 42,
      "tags": [{ "id": 8, "name": "outdoors" }],
      "createdAt": "2026-10-18T16:20:00Z",
      "updatedAt": "2026-10-18T16:20:00Z"
    },
    {
      "id": 974,
      "title": "Hiking checklist",
      "body": "Boots, map and first-aid kit.",
      "userId": 42,
      "tags": [{ "id": 8, "name": "outdoors" }],
      "createdAt": "2026-10-17T09:00:00Z",
      "updatedAt": "2026-10-17T09:00:00Z"
    }
  ],
  "nextCursor": "eyJpZCI6OTc0fQ"
}
```

## Error responses

The API uses consistent JSON errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "title must not be empty",
    "requestId": "req_01J9Q8M7"
  }
}
```

Possible status codes include:

| Status | Meaning |
| --- | --- |
| `400 Bad Request` | Malformed JSON, invalid fields, or unsupported query parameters |
| `401 Unauthorized` | Missing, expired, or invalid access token |
| `403 Forbidden` | The user is authenticated but cannot access the resource |
| `404 Not Found` | The requested note, tag, or user does not exist |
| `409 Conflict` | The request conflicts with current state, such as a duplicate email |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected server failure; the response includes a request ID for support |
