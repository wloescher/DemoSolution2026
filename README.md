WORK IN PROGRESS

Full-Stack Visual Studio 2026 solution

DATA LAYER
- SQL Server 2025 Database (SDK-style SQL project, Microsoft.Build.Sql)
- Repository (Entity Framework, EF Core Power Tools)
- Models

SERVICES LAYER
- Services (C# / .NET 10 / Dependency Injection / Interfaces)
- Web API (JWT Authentication)
- Tests
- Utilities
  
PRESENTATION LAYER (Bootstrap, FontAwesome)
- Angular v16
- React v19
- Vue v3.5
- Razor .NET 10
- Blazor .NET 10
- MudBlazor v9.7

SCREENSHOTS
- Documentation/ holds a screenshot of every page in each Presentation front-end,
  named <ProjectName>-<PageName>.png (e.g. DemoReact-ClientList.png).
- Regenerate them all with `npm run screenshots`, or one project with
  `npm run screenshots -- DemoReact`. Each dev server is started, captured, and
  stopped in turn; no Web API or SQL Server is needed. Requires Google Chrome and
  `npm install` in the JS front-ends (override with DOTNET= / CHROME=).
- The Weather and Error pages render random data and a per-request id, so those
  images differ on every run — discard the no-op diffs before committing.
