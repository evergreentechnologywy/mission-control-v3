# Mission Control v3

A modern NextJS dashboard for agent operations management.

## Features

- **Tasks** - Kanban board for task management (Recurring/Backlog/In Progress/Review/Done)
- **Content Pipeline** - Content creation workflow (Ideas → Scripting → Thumbnail → Filming → Editing)
- **Office** - Animated office floor with agent avatars showing real-time status
- **Team** - Meet the team page with agent profiles and skills
- **Memory** - Browse workspace files and journal entries
- **Calendar** - Weekly schedule view with event management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Database**: PostgreSQL
- **Auth**: JWT-based session authentication

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (or use the included Docker service)

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Production (Docker)

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Build and start
docker-compose up -d --build
```

The app will be available at port 3001 (to avoid conflicts with existing services).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_PASSWORD` | Login password | Required |
| `SESSION_SECRET` | JWT secret key | Required |
| `POSTGRES_*` | Database connection | See .env.example |
| `WORKSPACE_PATH` | Path to OpenClaw workspace | `/workspace` |

## Database Schema

The app uses the existing `agentopscenter` database with these tables:

- `board_tasks` - Task management
- `content_items` - Content pipeline items
- `calendar_events` - Calendar events
- `team_roles` - Team member definitions

## Pages

### Tasks (`/tasks`)
Kanban board with 5 columns: Recurring, Backlog, In Progress, Review, Done.
Features stats bar showing weekly tasks, in progress, total, and completion rate.

### Content Pipeline (`/content`)
Content creation workflow board with stages: Ideas, Scripting, Thumbnail, Filming, Editing.
Supports platform tags (YouTube, TikTok, Instagram, etc.).

### Office (`/office`)
Animated office view with pixel-art agent avatars. Agents show status (Working/Chatting/Walking/Idle) with animations. Includes demo mode for live activity simulation.

### Team (`/team`)
"Meet the Team" page with agent profiles organized by category (Input Signal, Output Action, Meta Layer). Shows colored skill tags and status indicators.

### Memory (`/memory`)
File browser for workspace files. Reads and renders markdown files including daily journal entries. Features search and expandable directory tree.

### Calendar (`/calendar`)
Weekly schedule grid with colored event pills by type. Shows "Always Running" background services and "Next Up" upcoming events.

## Customization

### Adding New Agents

Edit the agent definitions in:
- `/src/app/(dashboard)/office/page.tsx` - For office avatars
- `/src/app/(dashboard)/team/page.tsx` - For team page profiles

### Styling

Global styles are in `/src/app/globals.css`. Tailwind configuration is in `/tailwind.config.js`.

## License

Private - OpenClaw Internal Use
