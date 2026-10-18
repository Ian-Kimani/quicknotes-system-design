# QuickNotes data model

QuickNotes uses four core entities. IDs are generated integers, timestamps are
stored in UTC, and note bodies are plain text.

| Entity | Columns |
| --- | --- |
| `users` | `id BIGINT` primary key, `email VARCHAR(320)` unique not null, `display_name VARCHAR(120)` not null, `password_hash VARCHAR(255)` not null, `created_at TIMESTAMP` not null |
| `notes` | `id BIGINT` primary key, `user_id BIGINT` not null foreign key, `title VARCHAR(100)` not null, `body TEXT` nullable, `created_at TIMESTAMP` not null, `updated_at TIMESTAMP` not null |
| `tags` | `id BIGINT` primary key, `user_id BIGINT` not null foreign key, `name VARCHAR(50)` not null |
| `note_tags` | `note_id BIGINT` foreign key, `tag_id BIGINT` foreign key; composite primary key (`note_id`, `tag_id`) |

One user has many notes and many tags, so `users` to `notes` and `users` to
`tags` are one-to-many relationships. A note can have many tags and a tag can
be attached to many notes; `note_tags` represents that many-to-many relationship.
Tags are scoped to their owner to prevent one user from assigning another
user's private tags.

## Table definitions

```sql
CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  body TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notes_title_not_blank CHECK (length(trim(title)) > 0)
);

CREATE TABLE tags (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
  note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);
```

The main list screen filters by owner and newest update, so the following
index avoids scanning all notes:

```sql
CREATE INDEX idx_notes_user_updated
  ON notes (user_id, updated_at DESC, id DESC);
```

## Example queries

List a user's newest notes:

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = :user_id
ORDER BY updated_at DESC, id DESC
LIMIT :limit;
```

Find notes containing a phrase in the title:

```sql
SELECT id, title, updated_at
FROM notes
WHERE user_id = :user_id
  AND title ILIKE '%' || :search_term || '%'
ORDER BY updated_at DESC;
```

Load notes and their tags with a join:

```sql
SELECT n.id, n.title, t.id AS tag_id, t.name AS tag_name
FROM notes AS n
LEFT JOIN note_tags AS nt ON nt.note_id = n.id
LEFT JOIN tags AS t ON t.id = nt.tag_id
WHERE n.user_id = :user_id
ORDER BY n.updated_at DESC, n.id DESC;
```

Count notes per user:

```sql
SELECT u.id, u.email, COUNT(n.id) AS note_count
FROM users AS u
LEFT JOIN notes AS n ON n.user_id = u.id
GROUP BY u.id, u.email;
```

## SQL versus NoSQL

PostgreSQL is the better fit because notes, users, and tags have strong
relationships, ownership constraints, and transactional updates across
`notes` and `note_tags`. SQL gives reliable foreign keys, unique constraints,
joins, and mature indexing for the expected query patterns. A search engine
or document store can be added later for specialized full-text workloads, but
it should not replace the source of truth.
