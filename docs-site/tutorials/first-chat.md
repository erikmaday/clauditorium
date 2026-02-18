# Tutorial: First Chat Flow

Goal: create a conversation, continue it, inspect metadata, then delete it.

## 1. Start a conversation

```bash
curl -s -X POST http://127.0.0.1:5051/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My name is Erik.",
    "system": "Be concise."
  }'
```

Save `conversation_id` from the response.

## 2. Continue with context

```bash
curl -s -X POST http://127.0.0.1:5051/chat \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "YOUR_CONVERSATION_ID",
    "message": "What is my name?"
  }'
```

You should get an answer grounded in prior turns.

## 3. Inspect lifecycle metadata

```bash
curl -s http://127.0.0.1:5051/chat/YOUR_CONVERSATION_ID
```

Response includes:
- `message_count`
- `tokens_used` (estimated)
- `last_activity_at`
- `expires_at`

## 4. Delete the conversation

```bash
curl -s -X DELETE http://127.0.0.1:5051/chat/YOUR_CONVERSATION_ID
```

## Common mistakes

- Sending legacy `messages` payload. Current contract requires `message`.
- Sending `system` with `conversation_id`. `system` is only valid for new conversations.
- Reusing expired/evicted conversation IDs.
