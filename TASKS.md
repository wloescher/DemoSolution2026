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

---

# TASKS — Make DemoTests run & pass on macOS/Linux (InMemory)

Tracking issue: _pending_ — create via `gh-new-issue` after `gh auth refresh -h github.com -s project,read:project`.
Branch: `feature/inmemory-tests` (rename to `feature/<n>-inmemory-tests` once the issue number is known).

## Goal
`dotnet test Services/DemoTests/DemoTests.csproj` builds and passes on macOS/Linux with no SQL
Server. Previously 50/54 failed with `PlatformNotSupportedException: LocalDB is not supported on this
platform`.

## Tasks
- [x] Switch the test `DbContextFactory` from SQL Server LocalDB to the EF Core InMemory provider,
      config-driven via `Demo:UseInMemoryDatabase` (default `true`; `false` targets real SQL Server).
- [x] Share one `InMemoryDatabaseRoot` across the DI factory, `TestBase.CreateDbContext()`, and the
      Web API host (`BaseClasses/TestDatabase.cs`).
- [x] Allow the `[Keyless]`/`ToView` view entities to be seeded under InMemory only
      (`DemoSqlContext.InMemory.cs`, `OnModelCreatingPartial` guarded by provider name).
- [x] Seed deterministic fixture data matching `Demo:Test*Ids` (base tables + view sets + one audit
      row per entity type).
- [x] Override the Web API host DB in a custom `DemoWebApiFactory<T>`; point all `WebApiTests` at it.
- [x] Fix `appsettings.json` loading under a dot-prefixed (`.claude/`) worktree path
      (`PhysicalFileProvider` + `ExclusionFilters.None`); inject test config into the host.
- [x] Verify: all 54 tests pass on macOS (`~/.dotnet/dotnet test`), stable across repeated runs.
- [x] Update repo `CLAUDE.md` Tests section and `appsettings.json` comment; add `.gitignore`.
- [ ] Code-review gate on the working-tree diff (block on high-confidence correctness findings).
- [ ] Create the GitHub issue, associate the commit (`#<n>`), push, open a PR (`Closes #<n>`) —
      blocked on `gh` re-auth.

## Verification results
- **Build:** `dotnet build` clean (0 errors). **Tests:** `~/.dotnet/dotnet test` → **54 passed / 0
  failed**, stable across 4 consecutive runs.

## Notes / decisions
- Provider switch is config-driven (keeps a path to real SQL Server for Windows CI).
- Views are read-only projections; under InMemory they are independent sets that do **not**
  auto-reflect base-table mutations, so the seeder writes both. Services never mutate-then-read via a
  view, so this is safe.
- Uniqueness checks (`CheckForUnique*`) run in service code, not via DB constraints, so InMemory's
  lack of unique-index enforcement is not a problem.

---

# Follow-up: MSTEST0057 caller-info on the DI attribute

Tracking issue: [#3](https://github.com/wloescher/DemoSolution2026/issues/3)
Branch: `feature/3-mstest-caller-info`

## Tasks
- [x] Add a `[CallerFilePath]`/`[CallerLineNumber]` constructor to `TestMethodDependencyInjection`, forwarding to the base `TestMethodAttribute` ctor — resolves analyzer warning `MSTEST0057` so test source locations report correctly

## Verification results
- **Build:** `dotnet build Services/DemoTests/DemoTests.csproj` → 0 warnings, 0 errors (MSTEST0057 gone; base ctor signature `TestMethodAttribute(string callerFilePath, int callerLineNumber)` confirmed against MSTest 4.3.2).
- **Tests:** rebased on top of the InMemory work above, `~/.dotnet/dotnet test` → **54 passed / 0 failed**, confirming the DI-injection attribute still executes correctly with the new constructor and introduces no regression.
