# Baseline Development Environment Setup

How to bring up a working OpenBoxes development environment (database, seed data,
application, frontend) on this fork.

## Prerequisites

- Java 11 (e.g. `/usr/lib/jvm/java-11-openjdk-amd64` on Ubuntu; install with `apt install openjdk-11-jdk-headless`)
- Node 14 (via [nvm](https://github.com/nvm-sh/nvm): `nvm install 14`)
- Docker + Docker Compose (for the database)

## 1. Database (Docker)

Start a MariaDB container using the dev compose file (database only — the app runs on the host):

```bash
cd docker
docker compose -f docker-compose-dev.yml up -d
```

This creates a `openboxes-db` container listening on `localhost:3306` with:

| Setting  | Value       |
|----------|-------------|
| database | `openboxes` |
| user     | `openboxes` |
| password | `openboxes` |
| root pw  | `root`      |

Data is persisted in the `openboxes-dev-db` named volume, so it survives container restarts.
On subsequent runs, `docker start openboxes-db` (or the same `docker compose` command) is enough.

## 2. Application configuration

Grails reads external config from `~/.grails/openboxes-config.properties`. Create it once:

```bash
mkdir -p ~/.grails
cat > ~/.grails/openboxes-config.properties <<'EOF'
dataSource.username=openboxes
dataSource.password=openboxes
dataSource.url=jdbc:mysql://localhost:3306/openboxes?serverTimezone=UTC&useSSL=false
grails.mail.enabled=false
EOF
```

## 3. Seed / demo data

Schema and base data are created automatically: on first boot, `BootStrap.groovy` runs
the Liquibase migrations (`grails-app/migrations/`), and for an empty database the
consolidated `install/` changelogs create the full schema and insert the bare-minimum
base data — the `admin` superuser and two locations (Main Warehouse, Main Supplier).

To get meaningful demo data (a manager user, product categories, sample products and
baseline stock in the Main Warehouse), load the dev seed script **after the first boot**
(the schema must exist first):

```bash
docker exec -i openboxes-db mysql -uopenboxes -popenboxes openboxes < docker/seed-demo-data.sql
```

Then restart the app (or wait for the periodic `RefreshProductAvailabilityJob`) so the
product-availability cache picks up the new stock. The script only inserts data (no
schema changes — schema is managed exclusively by Liquibase) and is idempotent, so
re-running it is safe.

Available logins:

| Username  | Password   | Role       | Created by                  |
|-----------|------------|------------|-----------------------------|
| `admin`   | `password` | Superuser  | Liquibase install changelog |
| `manager` | `password` | Manager    | `docker/seed-demo-data.sql` |

To reset to a clean database, drop and recreate it (all data is lost):

```bash
docker compose -f docker/docker-compose-dev.yml down -v
docker compose -f docker/docker-compose-dev.yml up -d
# next `./gradlew bootRun` re-runs the install migrations; then re-load the seed script
```

## 4. Run the application

```bash
JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64 ./gradlew bootRun
```

- First boot runs all Liquibase migrations (~5–10 minutes). Later boots are much faster.
- `bootRun` also builds the React frontend bundle (`npm run bundle`) automatically.
- The app is served at <http://localhost:8080/openboxes>. Log in with `admin` / `password`.

## 5. Frontend build (React SPA under `src/js`)

The frontend requires Node 14:

```bash
source ~/.nvm/nvm.sh && nvm use 14
npm install        # once, to install dependencies
npm run bundle     # production build (also run automatically by bootRun)
npm run watch      # hot-reload rebuild during development
```

## 6. Tests and lint

```bash
# Frontend (Node 14)
npm test           # React/Jest tests
npm run eslint     # lint

# Backend (Java 11; integration tests start their own DB via Testcontainers)
JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64 ./gradlew test
JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64 ./gradlew integrationTest
```

## CI on this fork

GitHub Actions workflows in `.github/workflows/` run frontend and backend tests on
every pull request (`test-pull-request.yml`) and on pushes to main branches
(`on-change.yml`). Steps that depend on secrets that only exist in the upstream
`openboxes/openboxes` repository are skipped on this fork:

- **Codecov upload** (`backend-tests.yml`) — requires `CODECOV_TOKEN`.
- **Slack failure notifications** (`slack-notifier.yml`) — requires `SLACK_BUILD_STATUS_WEBHOOK`.
- **dbdocs publishing** (`dbdocs.yml`) — requires `DBDOCS_TOKEN`.

Test execution itself (frontend Jest tests, backend unit + integration tests against
MySQL 8 and MariaDB 10.3) runs fully on this fork. All workflows build with
Temurin (Adoptium) Java 11.
