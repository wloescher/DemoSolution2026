using DemoRepository.Entities;
using DemoServices;
using DemoServices.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.FileProviders.Physical;
using Moq;
using System.Security.Claims;

namespace DemoTests.BaseClasses
{
    [TestClass]
    public abstract class TestBase
    {
        // Dependencies
        private readonly DbContextOptions<DemoSqlContext> _dbContextOptions;
        internal static ServiceProvider? _serviceProvider;
        internal static IConfiguration? _configuration;
        internal static Mock<HttpContext> _mockHttpContext = new();

        // Configuration Values
        internal readonly List<int> _testClientIds = new();
        internal readonly List<int> _testClientUserIds = new();
        internal readonly List<int> _testUserIds = new();
        internal readonly List<int> _testWorkItemIds = new();
        internal readonly List<int> _testWorkItemUserIds = new();

        protected TestBase()
        {
            // Configuration
            _configuration = BuildConfiguration();

            // Data access — same provider/shared store as the DI factory and the Web API host.
            var dbContextOptionsBuilder = new DbContextOptionsBuilder<DemoSqlContext>();
            TestDatabase.Configure(dbContextOptionsBuilder, _configuration);
            _dbContextOptions = dbContextOptionsBuilder.Options;

            // Configuration Values
            _testClientIds = (_configuration.GetValue<string>("Demo:TestClientIds") ?? string.Empty).Split(',').Select(int.Parse).ToList();
            _testClientUserIds = (_configuration.GetValue<string>("Demo:TestClientUserIds") ?? string.Empty).Split(',').Select(int.Parse).ToList();
            _testUserIds = (_configuration.GetValue<string>("Demo:TestUserIds") ?? string.Empty).Split(',').Select(int.Parse).ToList();
            _testWorkItemIds = (_configuration.GetValue<string>("Demo:TestWorkItemIds") ?? string.Empty).Split(',').Select(int.Parse).ToList();
            _testWorkItemUserIds = (_configuration.GetValue<string>("Demo:TestWorkItemUserIds") ?? string.Empty).Split(',').Select(int.Parse).ToList();

            // Mock HttpContext
            _mockHttpContext.Setup(x => x.User).Returns(new ClaimsPrincipal(new ClaimsIdentity("Admin")));
        }

        [AssemblyInitialize]
        public static void AssemblyInitialize(TestContext testContext)
        {
            var serviceCollection = new ServiceCollection();

            var configuration = BuildConfiguration();

            // Add configuration
            serviceCollection.AddSingleton<IConfiguration>(configuration);

            // Add db context (InMemory by default; SQL Server when Demo:UseInMemoryDatabase is false)
            serviceCollection.AddDbContextFactory<DemoSqlContext>(
                options => TestDatabase.Configure(options, configuration), ServiceLifetime.Scoped
            );

            serviceCollection.AddMemoryCache();
            serviceCollection.AddHttpClient();

            // Add services
            serviceCollection.AddSingleton<IAuditService, AuditService>();
            serviceCollection.AddSingleton<IClientService, ClientService>();
            serviceCollection.AddSingleton<IUserService, UserService>();
            serviceCollection.AddSingleton<IWorkItemService, WorkItemService>();

            _serviceProvider = serviceCollection.BuildServiceProvider();

            // Seed the shared InMemory store once before any test runs (no-op for SQL Server).
            TestDatabase.Seed(configuration, _serviceProvider.GetRequiredService<IDbContextFactory<DemoSqlContext>>());
        }

        [AssemblyCleanup]
        public static void AssemblyCleanup()
        {
            _serviceProvider?.Dispose();
        }

        internal DemoSqlContext CreateDbContext()
        {
            return new DemoSqlContext(_dbContextOptions);
        }

        /// <summary>
        /// Build configuration from <c>appsettings.json</c> in the test output directory.
        /// Uses a <see cref="PhysicalFileProvider"/> with <see cref="ExclusionFilters.None"/> so
        /// the file is still found when the output path contains a "hidden" (dot-prefixed) segment
        /// — e.g. when running from a git worktree under <c>.claude/</c>.
        /// </summary>
        internal static IConfiguration BuildConfiguration()
        {
            var fileProvider = new PhysicalFileProvider(AppContext.BaseDirectory, ExclusionFilters.None);
            return new ConfigurationBuilder()
                .AddJsonFile(fileProvider, "appsettings.json", optional: false, reloadOnChange: false)
                .Build();
        }
    }
}
