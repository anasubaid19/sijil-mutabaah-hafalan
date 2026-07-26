# Sijil Mutaba'ah

Tahsin & Hifz Tracker — Catat dan pantau hafalan Al-Quran.

## Tech Stack

- **Runtime:** Bun
- **Framework:** TanStack Start (React SSR)
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Better Auth (email/password + username)
- **UI:** Tailwind CSS + shadcn-style components
- **PWA:** vite-plugin-pwa (offline support)

## Development

```bash
# Install dependencies
bun install

# Set up database
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run migrations
bunx drizzle-kit push

# Start dev server
bun run dev
```

App runs at `http://localhost:3000`.

## Deployment

### Quick Setup (recommended)

```bash
git clone https://github.com/anasubaid19/sijil-mutabaah-hafalan.git
cd sijil-mutabaah-hafalan
bash deploy/setup.sh
```

The script will prompt you for:
- **Domain** — e.g. `sijil.example.com`
- **Port** — default `3000`
- **DB credentials** — PostgreSQL user & password
- **App directory** — default `/opt/sijil-mutabaah`

Or use flags for non-interactive setup:

```bash
bash deploy/setup.sh \
  --domain sijil.example.com \
  --port 3001 \
  --db-name sijil_db \
  --db-user sijil
```

### Manual Setup

1. **Clone & build**
   ```bash
   git clone https://github.com/anasubaid19/sijil-mutabaah-hafalan.git
   cd sijil-mutabaah-hafalan
   bun install
   bun run build
   ```

2. **Configure**
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```
   DATABASE_URL=postgresql://sijil:yourpassword@localhost:5432/sijil_db
   BETTER_AUTH_SECRET=<random-secret>
   BETTER_AUTH_URL=https://sijil.example.com
   PORT=3000
   TRUSTED_ORIGINS=https://sijil.example.com
   ```

3. **Database**
   ```bash
   bunx drizzle-kit push
   ```

4. **Run**
   ```bash
   bun run start
   ```

### Reverse Proxy (nginx)

Copy `deploy/nginx-sijil.conf` to `/etc/nginx/conf.d/` and edit:
- Replace `sijil.yourdomain.com` with your actual domain
- Replace `3000` with your configured `PORT`

Then:
```bash
sudo certbot certonly --nginx -d sijil.example.com
sudo systemctl restart nginx
```

### systemd Service

The service file is at `deploy/sijil-mutabaah.service`. It reads `PORT` from `.env`.

```bash
sudo cp deploy/sijil-mutabaah.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sijil-mutabaah
sudo systemctl start sijil-mutabaah
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | — | Auth secret key (random string) |
| `BETTER_AUTH_URL` | Yes | — | App URL (e.g. `https://sijil.example.com`) |
| `PORT` | No | `3000` | Server port |
| `TRUSTED_ORIGINS` | No | — | Comma-separated allowed origins |

## License

MIT
