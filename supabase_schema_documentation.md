# 📚 Supabase Schema Documentation

This document describes the database schema for the interactive story application built on Supabase. It outlines the purpose of each table, its relationships, and how they interconnect to manage worlds, users, conversations, messages, and progress.

---

## 🗂️ Tables Overview

### 1. `users`

Holds user profile information.

| Column       | Type    | Description                 |
|--------------|---------|-----------------------------|
| `id`         | uuid    | Primary key, maps to `auth.users.id` |
| `email`      | text    | User's email                |
| `username`   | text    | Display name                |
| `created_at` | timestamp | Account creation date    |

---

### 2. `worlds`

Represents story worlds created by users or prebuilt.

| Column       | Type     | Description                      |
|--------------|----------|----------------------------------|
| `id`         | uuid     | Primary key                      |
| `user_id`    | uuid     | Foreign key to `users.id`        |
| `name`       | text     | World name                       |
| `genre`      | text     | World genre                      |
| `description`| text     | World description                |
| `tone`       | text     | Emotional tone or mood           |
| `image`      | text     | URL to preview image             |
| `created_at` | timestamp| When the world was created       |
| `is_prebuilt`| boolean  | Whether it's a prebuilt world    |
| `story_id`   | uuid     | Foreign key to `stories.id`      |

➤ **Relationships**:
- Belongs to a `user`
- References a `story`

---

### 3. `stories`

Holds the full context of the story associated with a world.

| Column         | Type     | Description                          |
|----------------|----------|--------------------------------------|
| `id`           | uuid     | Primary key                          |
| `world_name`   | text     | Name of the story's world            |
| `story_context`| jsonb    | Background context                   |
| `created_at`   | timestamp| Creation date                        |
| `image`        | text     | Main world image                     |
| `logo_image`   | text     | Optional logo for branding           |
| `description`  | text     | Long-form story description          |
| `chapters`     | jsonb    | JSON array of chapters and structure |

➤ **Relationships**:
- Linked to `worlds` via `story_id`

---

### 4. `conversations`

Tracks individual sessions where a user interacts with a world.

| Column       | Type      | Description                    |
|--------------|-----------|--------------------------------|
| `id`         | uuid      | Primary key                    |
| `world_id`   | uuid      | Foreign key to `worlds.id`     |
| `user_id`    | uuid      | Foreign key to `users.id`      |
| `started_at` | timestamp | When the convo began           |
| `ended_at`   | timestamp | When the convo ended (nullable)|
| `chapter_id` | text      | Current chapter in conversation|

➤ **Relationships**:
- Belongs to a `world`
- Belongs to a `user`
- Logs ongoing chapter through `chapter_id`

---

### 5. `messages`

Stores the messages exchanged in a conversation.

| Column         | Type      | Description                          |
|----------------|-----------|--------------------------------------|
| `id`           | uuid      | Primary key                          |
| `conversation_id` | uuid  | Foreign key to `conversations.id`    |
| `role`         | text      | Either `"user"` or `"assistant"`     |
| `content`      | text      | Message content                      |
| `timestamp`    | timestamp | When the message was created         |

➤ **Relationships**:
- Belongs to a `conversation`

---

### 6. `user_chapter_progress`

Tracks user progress through chapters of a story.

| Column       | Type      | Description                      |
|--------------|-----------|----------------------------------|
| `id`         | uuid      | Primary key                      |
| `user_id`    | uuid      | Foreign key to `users.id`        |
| `world_id`   | uuid      | Foreign key to `worlds.id`       |
| `chapter_id` | text      | ID of the chapter (custom)       |
| `is_completed`| boolean  | Whether chapter was completed    |
| `created_at` | timestamp | When record was created          |
| `updated_at` | timestamp | Last update timestamp            |

➤ **Relationships**:
- Tracks chapter completion per user, per world

---

## 🔄 Data Flow

1. A **user** signs in and is tracked in the `users` table.
2. They create or use a **world**, which links to a `story`.
3. When they begin an interaction, a **conversation** is created and tied to both the `user` and `world`.
4. **Messages** are logged within that conversation, alternating roles (`user`, `assistant`).
5. As users move through the **chapters** (within `stories.chapters`), their progress is recorded in `user_chapter_progress`.

---

## 💡 Notes

- Use the `is_prebuilt` flag to separate system-generated worlds from user-created ones.
- Chapters are stored in `stories.chapters` as a JSON array, but referenced in `conversations.chapter_id` and `user_chapter_progress.chapter_id` as strings for lookup.
- Deleting a world should cascade or clean related conversations and progress records (handle with caution or with soft-deletes).
---

## 🧠 `story_context` and `chapters` Explanation

### `story_context` (from `stories` table)

The `story_context` field is a `jsonb` column storing all narrative metadata about the world. This includes:

- **Tone**: Overall emotional tone (e.g. Romantic, Dramatic, Whimsical).
- **Themes**: Narrative themes that influence decisions and dialogue (e.g. Power dynamics, Forbidden romance).
- **Setting**: Time and location data like company name, size, and era.
- **Characters**: Array of characters with:
  - Name, role, background (age, job, motivations)
  - Personality traits and description
- **Key Elements**: Driving forces of the plot, like tension types, emotional arcs, or hidden dynamics.
- **Initial Scene**: How the story begins, used to generate the opening experience for the user.
- **Relationship Dynamics**: Type of romance or interaction to expect, setting up key emotional beats.

### Example:

```json
{
  "tone": "Romantic, intense, slightly dramatic",
  "themes": ["Power dynamics", "Forbidden romance"],
  "setting": {
    "company": {"name": "TechTrend Innovations", "size": "Large"},
    "location": "Corporate office", "time_period": "2025"
  },
  ...
}
```

---

### `chapters` (from `stories` table)

The `chapters` field is a `jsonb` array representing the full chapter structure of the story.

Each chapter includes:
- `chapterName`: The title of the chapter (used for navigation and UI display).
- `objective`: A clear narrative goal or turning point (e.g. “Go to the masquerade ball”).
- `chapterContext`: The scene's atmosphere and events — used to generate content during conversations.

### Example Chapter:

```json
{
  "objective": "Check in and go to your room",
  "chapterName": "The Lobby of Forgotten Time",
  "chapterContext": "You find yourself pushing open the grand hotel doors..."
}
```

These chapters are consumed dynamically in the app to:
- Guide the narrative flow
- Update user progress (`user_chapter_progress`)
- Track current location (`conversations.chapter_id`)

You can use chapter IDs (e.g., array index or unique key) to reference progress, unlock next chapters, and personalize future responses.

