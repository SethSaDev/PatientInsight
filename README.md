# PatientInsight

[![CI](https://github.com/SethSaDev/PatientInsight/actions/workflows/ci.yml/badge.svg)](https://github.com/SethSaDev/PatientInsight/actions/workflows/ci.yml)
![.NET 8](https://img.shields.io/badge/.NET-8-512BD4) ![Angular 17](https://img.shields.io/badge/Angular-17-DD0031) ![SQL Server](https://img.shields.io/badge/SQL%20Server-EF%20Core%208-CC2927) ![RabbitMQ](https://img.shields.io/badge/RabbitMQ-MassTransit-FF6600)

Patient records service with an ASP.NET Core API, an event-driven ingestion pipeline and an Angular front end.
Clinicians look up a patient by SSN, register new patients, and see lab visits, medications and vaccinations pulled from an external clinical API.

## Architecture

```text
Angular 17 UI ──HTTP──▶ PatientInsight.Api ──▶ PatientInsight.Core ──▶ PatientInsight.Infrastructure ──▶ SQL Server
                          │  (controllers,        (services,              (EF Core DbContext,
                          │   validation,          business rules)         repositories)
                          │   ProblemDetails)
                          │
                RabbitMQ ─┴─▶ PatientDataIngestConsumer ──▶ external clinical API (token auth)
                              syncs lab visits, medications, vaccinations
```

| Project | Responsibility |
|---|---|
| `PatientInsight.Domain` | Entities and DTOs, no external dependencies |
| `PatientInsight.Core` | Service interfaces and business logic, typed `HttpClient` for the external API |
| `PatientInsight.Infrastructure` | EF Core 8 `AppDbContext` and repositories for SQL Server |
| `PatientInsight.Api` | REST controllers, FluentValidation, global exception middleware returning RFC 7807 `ProblemDetails`, MassTransit consumer |
| `PatientInsight.Tests` | xUnit + Moq tests for the controller and PII masking |
| `PatientInsightUi` | Angular 17 standalone components, signals, functional HTTP interceptors |

## Design notes

- **Event-driven ingestion.** Pulling clinical history from the external API is slow, so it runs in a MassTransit consumer on RabbitMQ instead of inside the request. The API stays responsive and a slow upstream only backs up its own queue.
- **Cancellation end to end.** `CancellationToken` flows from the controller through services and repositories into outbound HTTP calls, so abandoned requests stop doing work.
- **PII-safe logging.** SSNs are masked to the last four digits (`***-**-6789`) before they reach structured logs. See [`PiiMask`](PatientInsight.Api/Logging/PiiMask.cs).
- **Consistent errors.** One middleware maps exceptions to `ProblemDetails`, so the UI handles a single error shape.

## API

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/patients/exists?ssn=` | Returns the patient id if a record exists |
| `GET` | `/api/patients/{id}` | Patient detail with visits, labs, medications and vaccinations |
| `POST` | `/api/patients` | Registers a patient and queues data ingestion |

Swagger UI is served at `/swagger` in Development.

## Running locally

Prerequisites: .NET 8 SDK, Node 20, SQL Server and RabbitMQ (Docker is easiest).

```bash
docker run -d --name sql -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD='YourStrong@Passw0rd' -p 1433:1433 mcr.microsoft.com/mssql/server:2022-latest
docker run -d --name rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# create the schema
sqlcmd -S localhost -U sa -P 'YourStrong@Passw0rd' -i PatientDB.sql

dotnet run --project PatientInsight.Api

cd PatientInsightUi
npm ci
npm start            # http://localhost:4200
```

Connection strings and the external API base URL live in `PatientInsight.Api/appsettings.json`. Override them with environment variables or user secrets for anything beyond local development.

## Tests

```bash
dotnet test                                                      # API: xUnit + Moq
cd PatientInsightUi && npx ng test --watch=false --browsers=ChromeHeadless   # UI: Jasmine/Karma
```

CI runs both suites plus the Angular production build on every push.

## Author

**Seth Sanders** - Senior Software Engineer (.NET, Angular/React, Azure)
[github.com/SethSaDev](https://github.com/SethSaDev)
