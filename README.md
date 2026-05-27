# iamout (자습시간 외출/복귀 자동화)

This is a slop prototype, built entirely by Claude Code.

## Setup

**1. Install dependencies**

```bash
pnpm install
```

**2. Configure environment**

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `DISCORD_TOKEN` | Bot token from [Discord Developer Portal](https://discord.com/developers/applications) |
| `DISCORD_CLIENT_ID` | Application ID from the same portal |
| `PORT` | HTTP port (default: `3000`) |

**3. Seed the database**

Edit `src/seed.js` to define your classrooms (grade, room, total student count), then run:

```bash
pnpm seed
```

**4. Run**

```bash
# Local
pnpm start

# Docker
docker build -t iamout .
docker run -d --env-file .env -p 3000:3000 iamout
```

## Slash commands

| Command | Description |
|---------|-------------|
| `/외출 [사유]` | Mark yourself as out (optionally with a reason) |
| `/복귀` | Mark yourself as returned |
| `/초기화` | Clear all absent students in your classroom |

## Web display

Visit `http://localhost:3000/[GRADE]-[CLASS]` for grade [GRADE] and class [CLASS].
