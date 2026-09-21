# Brain Agriculture API

Backend REST API developed for the **Brain Agriculture Technical Challenge v2**.

The application manages rural producers, farms, crop seasons, crops and plantings, including the business validations and aggregated datasets required by the challenge dashboard.

## Live demo

The application is deployed on AWS and can be accessed through HTTPS.

- **Swagger:** `https://54.175.21.69/docs`
- **OpenAPI JSON:** `https://54.175.21.69/docs-json`
- **Health check:** `https://54.175.21.69/health`

> The public environment is intended for technical challenge evaluation and may be unavailable after the evaluation period.

## Features

- Rural producer CRUD.
- CPF/CNPJ validation.
- One producer can own zero or more farms.
- Farm area validation: `arableArea + vegetationArea <= totalArea`.
- Crop seasons per farm.
- Multiple planted crops per crop season.
- Protection against duplicate crop registration in the same crop season.
- Validation that planted area does not exceed the farm's arable area.
- Business dashboard endpoints:
  - total registered farms;
  - total registered hectares;
  - farms grouped by state;
  - plantings grouped by crop;
  - land use totals.
- Swagger / OpenAPI documentation.
- PostgreSQL migrations.
- Unit and E2E tests.
- OpenTelemetry logs, metrics and traces.
- Grafana observability stack with Prometheus, Loki and Tempo.
- CI pipeline with automated build, lint, unit tests and E2E tests.
- Automated deployment to AWS EC2 after successful CI execution.
- GitHub Actions authentication to AWS through OpenID Connect (OIDC).
- Deployment through AWS Systems Manager (SSM), without public SSH access.
- Nginx reverse proxy with HTTPS.

## Tech stack

- Node.js 24
- TypeScript
- NestJS 12
- TypeORM
- PostgreSQL 18
- Docker / Docker Compose
- Vitest + Supertest
- Swagger / OpenAPI
- OpenTelemetry
- Prometheus
- Loki
- Tempo
- Grafana
- GitHub Actions
- AWS EC2
- AWS Systems Manager
- AWS IAM / OIDC
- Nginx
- Let's Encrypt

## Domain model

```text
Producer
   1
   |
   N
 Farm
   1
   |
   N
CropSeason
   1
   |
   N
Planting
   N
   |
   1
 Crop
```

A `Planting` associates a reusable `Crop` with a `CropSeason` and stores its planted area.

Important database constraints include:

- unique producer document;
- unique `(farm_id, year)` crop season;
- case-insensitive unique crop name;
- unique `(crop_season_id, crop_id)` planting;
- positive total farm area;
- non-negative arable and vegetation areas;
- `arable + vegetation <= total`;
- positive planted area.

## Architecture

The application follows a conventional NestJS layered design:

```text
HTTP
 |
Controllers
 |
DTO validation
 |
Services / business rules
 |
TypeORM
 |
PostgreSQL
```

The main modules are:

```text
src/
├── producers/
├── farms/
├── crop-seasons/
├── crops/
├── plantings/
├── dashboards/
├── database/
└── common/
```

A detailed architecture document is available at
[`brain-agriculture-architecture-doc.pdf`](./brain-agriculture-architecture-doc.pdf),
including architecture views, data modeling, business rules and technical decisions.

## Requirements

For local development:

- Docker
- Docker Compose

Node.js 24 is only required when running the application outside Docker.

## Environment variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Default development values:

```env
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=brain_agriculture
PORT=3000
```

Do not commit production credentials.

## Running with Docker

Build and start the complete stack:

```bash
docker compose up -d --build
```

Check the containers:

```bash
docker compose ps
```

Run the database migrations:

```bash
docker compose exec app npm run migration:run
```

Show migration status:

```bash
docker compose exec app npm run migration:show
```

The API is available at:

```text
http://localhost:3000
```

Swagger is available at:

```text
http://localhost:3000/docs
```

## Production deployment

The application is deployed to an AWS EC2 instance using Docker Compose.

Production traffic is handled by Nginx, which acts as a reverse proxy in front of the NestJS application and terminates HTTPS connections.

```text
Internet
   |
   | HTTPS :443
   v
 Nginx
   |
   v
NestJS API
   |
   v
PostgreSQL
```

The production environment uses an AWS Elastic IP to provide a stable public endpoint.

TLS is provided by Let's Encrypt.

### Production endpoints

| Resource | URL |
| --- | --- |
| API | `https://54.175.21.69` |
| Health check | `https://54.175.21.69/health` |
| Swagger | `https://54.175.21.69/docs` |
| OpenAPI JSON | `https://54.175.21.69/docs-json` |

## Main REST resources

```text
/producers
/farms
/crop-seasons
/crops
/plantings
/dashboards
```

The resource modules expose the operations required by the challenge. Swagger should be treated as the canonical interactive API contract for request/response payloads.

### Business dashboard

Because this is a backend-only submission, the dashboard requirement is exposed as datasets through REST endpoints. A frontend can render these datasets as cards and pie charts.

```text
GET /dashboards/totals
GET /dashboards/by-state
GET /dashboards/by-crop
GET /dashboards/land-use
```

`/dashboards/totals` returns farm count and total registered hectares.

`/dashboards/by-state` returns farm counts grouped by state.

`/dashboards/by-crop` returns planting count and planted hectares grouped by crop.

`/dashboards/land-use` returns total arable and vegetation hectares.

## Database migrations

Migrations are the source of truth for the database schema. TypeORM synchronization is disabled.

Run:

```bash
npm run migration:run
```

Revert the latest migration:

```bash
npm run migration:revert
```

Show migration status:

```bash
npm run migration:show
```

When using Docker, prefix these commands with:

```bash
docker compose exec app
```

## Tests

### Unit tests

```bash
npm run test
```

### E2E tests

The E2E suite uses `.env.test`:

```bash
npm run test:e2e
```

### Coverage

```bash
npm run test:cov
```

The repository includes reusable test factories, fixtures and TypeORM mocks under `test/`.

## Code quality

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Format:

```bash
npm run format
```

Before submission, a useful verification sequence is:

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```

## CI/CD

The repository uses GitHub Actions for Continuous Integration and Continuous Deployment.

### Continuous Integration

The CI workflow validates the application before deployment.

The pipeline includes:

```text
Build
  |
Lint
  |
Unit tests
  |
E2E tests
```

A deployment is only triggered when the CI workflow for the `main` branch completes successfully.

### Continuous Deployment

After a successful CI execution on `main`, the CD workflow deploys the application to the AWS EC2 production environment.

```text
GitHub Actions
      |
      | OIDC
      v
   AWS STS
      |
      v
AWS Systems Manager
      |
      | SSM Run Command
      v
     EC2
      |
      +-- Update source code
      +-- Build Docker images
      +-- Start infrastructure
      +-- Run database migrations
      +-- Start application
```

GitHub Actions authenticates to AWS using OpenID Connect (OIDC) and AWS STS. This avoids storing long-lived AWS access keys in GitHub.

Deployment commands are sent to the EC2 instance through AWS Systems Manager (SSM), so the deployment process does not depend on SSH credentials or a publicly exposed SSH port.

The production deployment:

1. updates the source code from `main`;
2. builds the production Docker images;
3. starts the infrastructure services;
4. runs pending TypeORM database migrations;
5. starts the application;
6. removes orphaned containers and unused Docker images.

GitHub Actions production environment variables are used for non-sensitive deployment configuration such as the AWS region, EC2 instance ID and IAM role ARN.

## Observability

The application initializes the OpenTelemetry Node SDK before NestJS and exports logs, metrics and traces through OTLP/HTTP to the OpenTelemetry Collector.

```text
NestJS
   |
   | OTLP
   v
OpenTelemetry Collector
   |
   +-- metrics --> Prometheus --+
   |                            |
   +-- logs ----> Loki ---------+--> Grafana
   |                            |
   +-- traces --> Tempo --------+
```

The application logs include OpenTelemetry correlation information such as `trace_id` and `span_id` when a log is emitted inside an active trace.

### Observability services

With the default Docker Compose ports:

| Service | Address |
| --- | --- |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Grafana | `http://localhost:3001` |
| Prometheus | `http://localhost:9090` |
| Loki | `http://localhost:3100` |
| Tempo | `http://localhost:3200` |
| pgAdmin | `http://localhost:5050` |

Grafana datasources are provisioned from `observability/grafana/provisioning`.

The Grafana stack is intended for **technical observability**. The `/dashboards/*` API endpoints are the **business dashboard** required by the challenge.

## Project structure

```text
.
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── nginx/
│   ├── conf.d/
│   │   └── default.conf
│   └── www/
├── observability/
│   ├── grafana/
│   ├── loki/
│   ├── otel-collector/
│   ├── prometheus/
│   └── tempo/
├── src/
│   ├── common/
│   ├── crop-seasons/
│   ├── crops/
│   ├── dashboards/
│   ├── database/
│   ├── farms/
│   ├── plantings/
│   ├── producers/
│   ├── instrumentation.ts
│   └── main.ts
├── test/
├── .dockerignore
├── .env.example
├── .gitignore
├── .prettierrc
├── brain-agriculture-architecture-doc.pdf
├── docker-compose.prod.yaml
├── docker-compose.yaml
├── Dockerfile
├── package.json
└── README.md
```

## Design decisions

### Decimal hectare values

Hectare values persisted as PostgreSQL `NUMERIC/DECIMAL` are represented as strings at the TypeScript persistence/API boundary where required. This avoids precision issues caused by JavaScript binary floating-point arithmetic.

### Application and database validation

Important business invariants are checked by application services for clear API errors. Critical numeric, referential and uniqueness constraints are also enforced by PostgreSQL migrations where appropriate.

### Planting as an association entity

`Planting` is not just a many-to-many join. It has domain data (`plantedAreaHa`) and therefore is modeled explicitly between `CropSeason` and `Crop`.

### Business dashboard vs Grafana

The challenge's agricultural dashboard is implemented by `/dashboards/*` REST endpoints. Grafana is separate and is used to inspect application telemetry.

### Deployment security

GitHub Actions uses OIDC federation to obtain temporary AWS credentials instead of storing long-lived access keys.

AWS Systems Manager is used to execute deployment commands on the EC2 instance, removing the need for GitHub Actions to connect directly to the server through SSH.

Nginx is responsible for the public HTTP/HTTPS entry point and proxies requests to the NestJS application.

## API documentation

For local development:

```text
http://localhost:3000/docs
http://localhost:3000/docs-json
```

For the deployed environment:

```text
https://54.175.21.69/docs
https://54.175.21.69/docs-json
```

Swagger documents the request DTOs, validation contract and response models for the API.

## License

This repository was created as a technical challenge submission and is marked `UNLICENSED` in `package.json`.