# TASKS — Upgrade to .NET 10 / Visual Studio 2026 / SQL Server 2025

Tracking issue: [#1](https://github.com/wloescher/DemoSolution2026/issues/1)
Branch: `feature/1-net10-upgrade`

## Tasks
- [x] Adopt Central Package Management + pin SDK (`global.json`, `Directory.Packages.props`)
- [x] Retarget all 8 C# projects to `net10.0`
- [x] Update NuGet packages (framework → 10.0.10; security/currency bumps; remove legacy ASP.NET Core shim packages via `FrameworkReference`)
- [x] Remove unused packages (Microsoft.Identity.Web, .UI, Authentication.OpenIdConnect — auth is fully custom JWT)
- [x] Migrate Web API Swagger setup to Microsoft.OpenApi v2 (Swashbuckle 10)
- [x] Migrate custom MSTest DI attribute to MSTest 4.x async API (`ExecuteAsync`/`InvokeAsync`)
- [x] Convert `DemoSql` to SDK-style (`Microsoft.Build.Sql`) targeting `Sql170` (SQL Server 2025)
- [x] Update docs (`README.md`, `CLAUDE.md`) and disabled CI workflows
- [x] Verify: build, tests, vulnerability sweep, Web API Swagger smoke test

## Verification results
- **Build:** all 8 C# projects + the SDK-style `DemoSql.sqlproj` build on macOS with the .NET 10 SDK (10.0.302). `DemoSql.dacpac` produced targeting `Sql170`.
- **Tests:** `dotnet test` → 4 passed / 50 failed. The 50 failures are `LocalDB is not supported on this platform` (Windows-only); the net8 baseline on `main` fails the **identical** 50 / passes the same 4, so the upgrade introduces **zero regressions**. Full suite expected green on Windows with LocalDB + a seeded database.
- **Security:** `dotnet list package --vulnerable --include-transitive` → no vulnerable packages.
- **API smoke test:** Web API starts; `/swagger/v1/swagger.json` → HTTP 200, valid OpenAPI 3.0.4, `Bearer` security scheme present, 22 paths — confirms the Microsoft.OpenApi v2 migration works at runtime.

## Windows-only follow-ups (cannot verify on macOS)
- Open the solution in **Visual Studio 2026** and confirm all projects load (the `.sln` VS-version header updates on first open; the SDK-style SQL project loads under VS 2026's SQL tooling).
- Build/publish the `DemoSql` DACPAC against a **SQL Server 2025** instance and run the full test suite against LocalDB.
- Regenerate the `DemoRepository` EF entities and `DemoSqlContext` with **EF Core Power Tools** (EF Core 10) against the SQL Server 2025 schema. The package references are already on EF Core 10.0.10, but the generated code itself was not regenerated in this upgrade (Power Tools runs in Visual Studio on Windows; config in `efpt.config.json`).
