# TASKS — Add MudBlazor v9.7 Presentation front-end (DemoMudBlazor)

Tracking issue: [#8](https://github.com/wloescher/DemoSolution2026/issues/8)
Branch: `feature/8-mudblazor`

## Goal
Add a `DemoMudBlazor` Presentation project — a functional copy of `Presentation/DemoBlazor`
(.NET 10 Blazor Web App, Interactive Server) re-skinned with **MudBlazor v9.7** in place of
Bootstrap. No API integration (matches DemoBlazor's self-contained mock-data behavior).

## Tasks
- [x] Add `MudBlazor` `PackageVersion` (9.7.0) to `Directory.Packages.props`
- [x] Scaffold `Presentation/DemoMudBlazor` (csproj, `Program.cs` with `AddMudServices()`,
      appsettings, launchSettings with new ports 5150/7211, wwwroot without Bootstrap)
- [x] Re-skin `App.razor` (Mud CSS/JS), `_Imports.razor`, `Routes.razor`
- [x] Rebuild `MainLayout` (MudLayout/MudAppBar/MudDrawer + providers) and `NavMenu` (MudNavMenu)
- [x] Re-skin pages: Home, Counter (MudButton), Weather (MudTable), Error
- [x] Register project in `DemoSolution.sln` under the Presentation solution folder
- [x] Update docs: `README.md`, `CLAUDE.md`, `TASKS.md`
- [x] Build (project + solution), run and visually verify the Mud shell, run test suite

## Verification results
- **Build:** `~/.dotnet/dotnet build Presentation/DemoMudBlazor/DemoMudBlazor.csproj` → 0 warnings,
  0 errors. Solution parses and lists the new project (`dotnet sln list`).
- **Run:** launched on `http://localhost:5150`; visually verified in browser — Material AppBar +
  MudDrawer nav, Home (Mud typography), Counter (`MudButton` increments via the interactive Server
  circuit, `OnClick`), Weather (`MudTable` shows streamed forecast rows).
- **Tests:** `~/.dotnet/dotnet test Services/DemoTests` → **54 passed / 0 failed** (no regressions;
  pre-existing `DemoUtilities` warnings only).

---

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

Tracking issue: [#5](https://github.com/wloescher/DemoSolution2026/issues/5) (merged via [PR #6](https://github.com/wloescher/DemoSolution2026/pull/6))
Branch: `feature/5-inmemory-tests`

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
- [x] Code-review gate on the working-tree diff (block on high-confidence correctness findings).
- [x] Create the GitHub issue (#5), associate the commit, push, open a PR (`Closes #5`) — merged as PR #6.

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

---

# Follow-up: Presentation front-end page screenshots

Tracking issue: _pending — no issue number provided_
Branch: `feature/docs-presentation-screenshots`

## Goal
Capture a screenshot of every page in each of the six Presentation front-ends and commit them to
`Documentation/`, prefixed with the project name (`<ProjectName>-<PageName>.png`).

## Tasks
- [x] Add launch configs for all six front-ends to `.claude/launch.json` (DemoBlazor 5139,
      DemoMudBlazor 5150, DemoRazor 5216, DemoAngular 50395, DemoVue 50400, DemoReact 64940)
- [x] `npm install` for DemoReact / DemoAngular / DemoVue (no `node_modules` checked in)
- [x] Capture DemoBlazor (4), DemoMudBlazor (4), DemoRazor (3), DemoVue (1)
- [x] Capture DemoReact (17) and DemoAngular (17), driving the dummy `admin`/`admin` login form
      first so the auth-guarded routes render
- [x] Update `README.md` with a pointer to `Documentation/`
- [x] Fix the misplaced quote in the Angular `workitem/:id` route (title string had swallowed
      `canActivate: [AuthGuard]`), spotted while capturing the screenshots
- [ ] Associate with a GitHub issue, push, open a PR

## Notes / decisions
- Screenshots are full-page, 1440x900 viewport at 2x device scale, light color scheme, captured
  headlessly via `playwright-core` driving the installed Google Chrome.
- No Web API or SQL Server is needed: React and Angular both ship client-side dummy auth
  (`AuthProvider.jsx` / `auth.service.ts`) and inline test data, so every route renders standalone.
- Detail/edit pages use ids present in that test data — Client 1, User 3, Work Item 2.
- `DemoVue` is still the default Vite scaffold, so it has a single page.
- `DemoBlazor`, `DemoMudBlazor`, and `DemoRazor` are default scaffolds (Home/Counter/Weather/Error
  and Index/Privacy/Error respectively).
