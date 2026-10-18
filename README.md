# QuickNotes

QuickNotes is a small notes application prototype and a production-oriented
design exercise. The browser client proves GET, POST, and DELETE API
integration against JSONPlaceholder, while the documents describe the real
service that could support one million users.

## Run the API client

Because the client uses browser JavaScript and calls a remote API, serve the
repository with any static HTTP server, then open the local URL:

```bash
python -m http.server 8000
```

Visit <http://localhost:8000>, click **Load notes**, or create a note with the
form. JSONPlaceholder simulates writes and deletes for practice; it does not
persist notes between requests.

## Design documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## What I learned

- A small API client still needs explicit loading, success, error, and empty
  states to make asynchronous behavior understandable.
- Rendering user-controlled values with `textContent` rather than HTML
  interpolation prevents accidental markup injection.
- A normalized SQL model makes ownership, tags, joins, and transactional
  updates explicit.
- Stateless application servers, caching, read replicas, and a durable queue
  let the service scale without making slow background work block users.
