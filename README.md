# iamout (자습시간 외출/복귀 자동화)

This is a slop prototype, built entirely by Claude Code.

## Setup

```bash
cp .env.example .env
# fill in MONGODB_URI, DISCORD_TOKEN, DISCORD_CLIENT_ID
```

Edit `src/seed.js` to define your classrooms, then seed the DB:

```bash
pnpm seed
```

Start the server and bot:

```bash
pnpm start
```

## Slash commands

| Command | Description |
|---------|-------------|
| `/외출 [사유]` | Mark yourself as out (optionally with a reason) |
| `/복귀` | Mark yourself as returned |
| `/초기화` | Clear all absent students in your classroom |

## Web display

Visit `http://localhost:3000/[GRADE]-[CLASS]` for grade [GRADE] and class [CLASS].
