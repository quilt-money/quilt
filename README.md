# Quilt

Quilt shows how your money is allocated across accounts, asset types, sectors and regions. It also does basic profit/loss tracking, but the main point is answering "where is my money sitting?"

Everything is stored locally in SQLite. The only external service is [Financial Modeling Prep](https://site.financialmodelingprep.com/) (optional), used to fetch prices and security metadata.

### Project scope

Quilt is a personal, self-hosted tool for seeing how your investments are allocated. It is deliberately small.

The main goal is to provide a nice UI for viewing your portfolio, in aggregate. We also have some nice reporting and data viz features, but this app is purposefully not a full-featured portfolio tracker.

Look at the screenshots to understand what it is capable of, and if it may suit your purposes.

If you need any of the `Out of scope` features, there are better alternatives to try out (eg. Wealthfolio).

**In scope**

- Allocation views across accounts, security types, sectors, regions and tags
- Basic gain/loss per holding, based on cost basis and the latest price
- Holdings imported from CSV (`Symbol, Shares, Basis`) and manual edits to security metadata
- Saved reports, including value over time
- Single-user, local storage in SQLite, runs on a home server or Raspberry Pi

**Out of scope**

- Brokerage connections or automatic account syncing
- Transaction history, tax lots, dividends, or realized gains and tax reporting
- Performance analytics such as time-weighted or money-weighted returns, or benchmarking
- Trading, rebalancing orders, or financial advice
- Multi-user accounts or authentication. If you expose Quilt beyond your own network, put it behind a reverse proxy with auth.

## Getting started

### Docker

Images are built by CI and published to GHCR for `amd64` and `arm64` (including Raspberry Pi).

Create a `.env` file with your settings:

```sh
FMP_API_KEY=your_key
ORIGIN=http://localhost:3000
```

- Set `ORIGIN` to the URL you use to reach the app.

Then start the container:

```sh
docker compose -f docker/docker-compose.yml --project-directory . up -d
```

#### Data storage

The database lives at `/data` in the container. By default it is stored in a Docker named volume called `quilt-data`, which works on any machine with no setup.

To store it in a folder on the host instead (for example, to back it up), set `QUILT_DATA` in `.env` to a path:

```sh
QUILT_DATA=./quilt-data
```

Relative paths resolve from the repo root. The container runs as the `node` user (uid 1000), so the folder must be writable by that user, or the database can't be opened.

Changing `QUILT_DATA` points the app at a different location, so it starts with an empty database. Move your existing data over first if you want to keep it.

### Local development

Requires [bun](https://bun.sh).

```sh
cp .env.example .env   # set FMP_API_KEY
bun install
bun run db:reset       # create local.db, migrate, seed lookups
bun run dev            # http://localhost:5173
```

`db:reset` deletes `local.db`, so don't run it against data you want to keep.

## Using Quilt

1. **Create accounts.** Add each brokerage, retirement or other account on the **Accounts** page.
2. **Import holdings.** Open an account and use **Upload** to import a CSV with exactly these columns:

   ```csv
   Symbol,Shares,Basis
   VTI,120.5,24000
   BND,80,6400
   ```

   `Basis` is the total cost basis for the position. Each upload replaces the account's holdings, so securities missing from the CSV are treated as sold. Re-upload whenever the account changes.

3. **Sync prices and metadata.** On the **Securities** page, run a sync to fetch the latest prices plus each security's type, sector and region from FMP. Securities can be edited by hand if the data is missing or wrong.
4. **Explore the portfolio.** The **Portfolio** page shows all holdings with value and gain/loss. Use search, column filters and sorting.
5. **Build reports.** On **Reports**, create charts of any metric (such as value or gain/loss) broken down by account, security type, sector, region or tag, or plotted over time. Reports are saved so you can come back to them.

## Development

| Command                              | Purpose                                             |
| ------------------------------------ | --------------------------------------------------- |
| `bun run check`                      | Type check (svelte-check)                           |
| `bun run lint`                       | Prettier check and ESLint                           |
| `bun run format`                     | Format with Prettier                                |
| `bun run db:generate` / `db:migrate` | Create / apply migrations after editing `schema.ts` |
| `bun run db:studio`                  | Browse the database in Drizzle Studio               |

## Releasing

Docker images are published to GHCR only when a version tag is pushed. Pushes to `main` and pull requests run the checks and test-build the image without publishing it.

1. Make sure `main` has the commit you want to release and CI is green.
2. Tag the commit with a [semver](https://semver.org) version prefixed with `v`, and push the tag:

   ```sh
   git tag v1.2.3
   git push origin v1.2.3
   ```

3. Watch the **Docker** workflow in the repo's Actions tab. It builds `amd64` and `arm64` natively and publishes one multi-arch image.
4. On the first release only, make the package public: GitHub → the org's **Packages** → `quilt` → **Package settings** → **Change visibility**.

Each release publishes one image under the tag matching the version, for example `1.2.3` for `v1.2.3`, plus `latest` for stable releases. Pre-releases like `v1.0.0-rc.1` don't update `latest`. There are no floating `1.2` / `1` tags, so pin the exact version for reproducible deployments.

To deploy a specific version, set the image in `docker/docker-compose.yml` to `ghcr.io/quilt-money/quilt:1.2.3`. To deploy the latest version, use `ghcr.io/quilt-money/quilt:latest`
