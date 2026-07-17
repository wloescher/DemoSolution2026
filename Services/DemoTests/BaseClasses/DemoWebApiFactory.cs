using DemoRepository.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DemoTests.BaseClasses
{
    /// <summary>
    /// A <see cref="WebApplicationFactory{TEntryPoint}"/> that boots the real Web API host but swaps
    /// its <c>DemoSqlContext</c> registration for the shared InMemory store used by the rest of the
    /// suite (see <see cref="TestDatabase"/>). This lets the Web API integration tests run without
    /// SQL Server, and — because the host and the service-level tests share one seeded store — the
    /// values returned over HTTP match the values computed directly from the services.
    ///
    /// When <c>Demo:UseInMemoryDatabase</c> is <c>false</c> this is a no-op passthrough and the host
    /// keeps its own SQL Server registration.
    /// </summary>
    public class DemoWebApiFactory<TEntryPoint> : WebApplicationFactory<TEntryPoint> where TEntryPoint : class
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            var configuration = TestBase.BuildConfiguration();

            // Feed the test configuration into the host so it reads the same Demo:* and Jwt:* values
            // as the service-level tests. This is also required because the host's own appsettings.json
            // is not loaded when the content root path contains a "hidden" (dot-prefixed) segment
            // (e.g. a git worktree under .claude/), which would otherwise leave Demo:CacheSeconds empty
            // and throw on every request.
            builder.ConfigureAppConfiguration((_, configBuilder) => configBuilder.AddConfiguration(configuration));

            if (!TestDatabase.UseInMemory(configuration))
            {
                return;
            }

            builder.ConfigureTestServices(services =>
            {
                // Drop the host's SQL Server DbContext factory/options/options-configuration and
                // re-register on InMemory pointing at the shared root, so the host sees the data
                // seeded in AssemblyInitialize. The options-configuration descriptor must be removed
                // too, otherwise both the SQL Server and InMemory providers would be applied (and a
                // provider/lifetime mismatch breaks DI scope validation). Match the host's Scoped
                // factory lifetime (see DemoWebApi/Program.cs).
                services.RemoveAll(typeof(IDbContextFactory<DemoSqlContext>));
                services.RemoveAll(typeof(DbContextOptions<DemoSqlContext>));
                services.RemoveAll(typeof(IDbContextOptionsConfiguration<DemoSqlContext>));

                services.AddDbContextFactory<DemoSqlContext>(
                    options => TestDatabase.Configure(options, configuration), ServiceLifetime.Scoped);
            });
        }
    }
}
