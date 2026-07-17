using DemoRepository.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;

namespace DemoTests.BaseClasses
{
    /// <summary>
    /// Centralizes the test database provider and its deterministic seed data.
    ///
    /// By default the suite runs against the EF Core <b>InMemory</b> provider so it is fully
    /// portable (macOS / Linux / CI) and needs no SQL Server. Set <c>Demo:UseInMemoryDatabase</c>
    /// to <c>false</c> in <c>appsettings.json</c> to instead target the real SQL Server named in
    /// <c>ConnectionStrings:DefaultConnection</c> (e.g. on a Windows CI agent), in which case the
    /// database is expected to already contain the rows referenced by the <c>Demo:Test*Ids</c>
    /// values and no seeding is performed.
    ///
    /// A single shared <see cref="InMemoryDatabaseRoot"/> is used so that every context — those
    /// created by the DI <see cref="IDbContextFactory{TContext}"/>, <see cref="TestBase.CreateDbContext"/>,
    /// and the <see cref="DemoWebApiFactory{T}"/> host — reads and writes the same in-memory store.
    /// </summary>
    internal static class TestDatabase
    {
        internal const string DatabaseName = "DemoSql";

        /// <summary>Shared root so all InMemory contexts see the same data within the test process.</summary>
        internal static readonly InMemoryDatabaseRoot Root = new();

        internal static bool UseInMemory(IConfiguration configuration)
            => configuration.GetValue("Demo:UseInMemoryDatabase", true);

        /// <summary>
        /// Configure a context/options builder for the selected provider. Used by the DI
        /// registration, <see cref="TestBase.CreateDbContext"/>, and the Web API test host so they
        /// stay in lock-step.
        /// </summary>
        internal static void Configure(DbContextOptionsBuilder options, IConfiguration configuration)
        {
            if (UseInMemory(configuration))
            {
                options.UseInMemoryDatabase(DatabaseName, Root);
            }
            else
            {
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));
            }
        }

        /// <summary>
        /// Seed the deterministic fixture the tests rely on. Idempotent and InMemory-only.
        /// The <c>Demo:Test*Ids</c> config values point at these ids.
        /// </summary>
        internal static void Seed(IConfiguration configuration, IDbContextFactory<DemoSqlContext> dbContextFactory)
        {
            if (!UseInMemory(configuration))
            {
                return;
            }

            using var dbContext = dbContextFactory.CreateDbContext();

            // Idempotent: only seed an empty store.
            if (dbContext.Users.Any())
            {
                return;
            }

            SeedUsers(dbContext);
            SeedClients(dbContext);
            SeedWorkItems(dbContext);
            SeedClientUsers(dbContext);
            SeedWorkItemUsers(dbContext);
            SeedAudits(dbContext);

            dbContext.SaveChanges();
        }

        // ---- Users (ids 1..6) ----------------------------------------------------------------
        private static void SeedUsers(DemoSqlContext dbContext)
        {
            for (var i = 1; i <= 6; i++)
            {
                dbContext.Users.Add(new User
                {
                    UserId = i,
                    UserGuid = MakeGuid(i, 1),
                    UserTypeId = i, // 1..6 map to valid UserType values
                    UserEmailAddress = $"user{i}@example.com",
                    UserIsActive = true,
                    UserIsDeleted = false,
                    UserPassword = $"Pass{i}",
                    UserFirstName = $"FirstName{i}",
                    UserMiddleName = $"M{i}",
                    UserLastName = $"LastName{i}",
                    UserAddressLine1 = $"456 Elm St Apt {i}",
                    UserAddressLine2 = null,
                    UserCity = $"City_{i}",
                    UserRegion = $"Region_{i}",
                    UserPostalCode = $"{10000 + i}",
                    UserCountry = "USA",
                    UserPhoneNumber = $"+1-555-{1000 + i}",
                    UserPasswordHash = $"hash{i}",
                    UserPasswordAttemptCount = 0,
                });

                dbContext.UserViews.Add(new UserView
                {
                    UserId = i,
                    Guid = MakeGuid(i, 1),
                    TypeId = i,
                    Type = $"UserType{i}",
                    IsActive = true,
                    EmailAddress = $"user{i}@example.com",
                    FirstName = $"FirstName{i}",
                    MiddleName = $"M{i}",
                    LastName = $"LastName{i}",
                    AddressLine1 = $"456 Elm St Apt {i}",
                    AddressLine2 = null,
                    City = $"City_{i}",
                    Region = $"Region_{i}",
                    PostalCode = $"{10000 + i}",
                    Country = "USA",
                    PhoneNumber = $"+1-555-{1000 + i}",
                });
            }
        }

        // ---- Clients (ids 1..3, all active and non-Internal so GetClients returns them) -------
        private static void SeedClients(DemoSqlContext dbContext)
        {
            // TypeId: 2 = External, 3 = Lead (1 = Internal is excluded by GetClients).
            var typeIds = new[] { 0, 2, 3, 2 };
            for (var i = 1; i <= 3; i++)
            {
                dbContext.Clients.Add(new Client
                {
                    ClientId = i,
                    ClientGuid = MakeGuid(i, 2),
                    ClientTypeId = typeIds[i],
                    ClientName = $"Client_{i:0000}",
                    ClientIsActive = true,
                    ClientIsDeleted = false,
                    ClientAddressLine1 = $"123 Main St Apt {i}",
                    ClientAddressLine2 = null,
                    ClientCity = $"City_{i}",
                    ClientRegion = $"Region_{i}",
                    ClientPostalCode = $"{20000 + i}",
                    ClientCountry = "USA",
                    ClientPhoneNumber = $"+1-393-{7000 + i}",
                    ClientUrl = $"https://www.client{i}.com",
                });

                dbContext.ClientViews.Add(new ClientView
                {
                    ClientId = i,
                    Guid = MakeGuid(i, 2),
                    TypeId = typeIds[i],
                    Type = $"ClientType{i}",
                    IsActive = true,
                    Name = $"Client_{i:0000}",
                    AddressLine1 = $"123 Main St Apt {i}",
                    AddressLine2 = null,
                    City = $"City_{i}",
                    Region = $"Region_{i}",
                    PostalCode = $"{20000 + i}",
                    Country = "USA",
                    PhoneNumber = $"+1-393-{7000 + i}",
                    Url = $"https://www.client{i}.com",
                });
            }
        }

        // ---- WorkItems (ids 1..3, all belong to Client 1 and are active) ---------------------
        private static void SeedWorkItems(DemoSqlContext dbContext)
        {
            for (var i = 1; i <= 3; i++)
            {
                dbContext.WorkItems.Add(new WorkItem
                {
                    WorkItemId = i,
                    WorkItemGuid = MakeGuid(i, 3),
                    WorkItemClientId = 1,
                    WorkItemTypeId = 1,
                    WorkItemStatusId = 1,
                    WorkItemIsActive = true,
                    WorkItemIsDeleted = false,
                    WorkItemTitle = $"WorkItem_1_{i}",
                    WorkItemSubTitle = $"SubTitle for WorkItem_1_{i}",
                    WorkItemSummary = $"Summary for WorkItem_1_{i}",
                    WorkItemBody = $"Body for WorkItem_1_{i}",
                });

                dbContext.WorkItemViews.Add(new WorkItemView
                {
                    WorkItemId = i,
                    Guid = MakeGuid(i, 3),
                    ClientId = 1,
                    ClientName = "Client_0001",
                    TypeId = 1,
                    Type = "User Story",
                    StatusId = 1,
                    Status = "New",
                    IsActive = true,
                    Title = $"WorkItem_1_{i}",
                    SubTitle = $"SubTitle for WorkItem_1_{i}",
                    Summary = $"Summary for WorkItem_1_{i}",
                    Body = $"Body for WorkItem_1_{i}",
                });
            }
        }

        // ---- ClientUser links (ids 1..3) — Client 1 <-> User 1 gives the "first" lookups data -
        private static void SeedClientUsers(DemoSqlContext dbContext)
        {
            var links = new[] { (0, 0), (1, 1), (1, 2), (2, 1) };
            for (var i = 1; i <= 3; i++)
            {
                var (clientId, userId) = links[i];
                dbContext.ClientUsers.Add(new ClientUser
                {
                    ClientUserId = i,
                    ClientUserClientId = clientId,
                    ClientUserUserId = userId,
                    ClientUserIsDeleted = false,
                });

                dbContext.ClientUserViews.Add(new ClientUserView
                {
                    ClientUserId = i,
                    ClientId = clientId,
                    UserId = userId,
                    ClientName = $"Client_{clientId:0000}",
                    UserEmailAddress = $"user{userId}@example.com",
                });
            }
        }

        // ---- WorkItemUser links (ids 1..3) — WorkItem 1 <-> User 1 -----------------------------
        private static void SeedWorkItemUsers(DemoSqlContext dbContext)
        {
            var links = new[] { (0, 0), (1, 1), (1, 2), (2, 1) };
            for (var i = 1; i <= 3; i++)
            {
                var (workItemId, userId) = links[i];
                dbContext.WorkItemUsers.Add(new WorkItemUser
                {
                    WorkItemUserId = i,
                    WorkItemUserWorkItemId = workItemId,
                    WorkItemUserUserId = userId,
                    WorkItemUserIsDeleted = false,
                });

                dbContext.WorkItemUserViews.Add(new WorkItemUserView
                {
                    WorkItemUserId = i,
                    WorkItemId = workItemId,
                    UserId = userId,
                    WorkItemTitle = $"WorkItem_1_{workItemId}",
                    UserEmailAddress = $"user{userId}@example.com",
                });
            }
        }

        // ---- One "Create" audit row per entity type for the "first" test id -------------------
        private static void SeedAudits(DemoSqlContext dbContext)
        {
            var now = DateTime.Now;

            dbContext.ClientAudits.Add(new ClientAudit
            {
                ClientAuditActionId = 1,
                ClientAuditClientId = 1,
                ClientAuditUserId = 1,
                ClientAuditDate = now,
                ClientAuditBeforeJson = string.Empty,
                ClientAuditAfterJson = string.Empty,
                ClientAuditAffectedColumns = string.Empty,
            });

            dbContext.ClientUserAudits.Add(new ClientUserAudit
            {
                ClientUserAuditActionId = 1,
                ClientUserAuditClientUserId = 1,
                ClientUserAuditUserId = 1,
                ClientUserAuditDate = now,
                ClientUserAuditBeforeJson = string.Empty,
                ClientUserAuditAfterJson = string.Empty,
                ClientUserAuditAffectedColumns = string.Empty,
            });

            dbContext.UserAudits.Add(new UserAudit
            {
                UserAuditActionId = 1,
                UserAuditUserId = 1,
                UserAuditUserIdSource = 1,
                UserAuditDate = now,
                UserAuditBeforeJson = string.Empty,
                UserAuditAfterJson = string.Empty,
                UserAuditAffectedColumns = string.Empty,
            });

            dbContext.WorkItemAudits.Add(new WorkItemAudit
            {
                WorkItemAuditActionId = 1,
                WorkItemAuditWorkItemId = 1,
                WorkItemAuditUserId = 1,
                WorkItemAuditDate = now,
                WorkItemAuditBeforeJson = string.Empty,
                WorkItemAuditAfterJson = string.Empty,
                WorkItemAuditAffectedColumns = string.Empty,
            });

            dbContext.WorkItemUserAudits.Add(new WorkItemUserAudit
            {
                WorkItemUserAuditActionId = 1,
                WorkItemUserAuditWorkItemUserId = 1,
                WorkItemUserAuditUserId = 1,
                WorkItemUserAuditDate = now,
                WorkItemUserAuditBeforeJson = string.Empty,
                WorkItemUserAuditAfterJson = string.Empty,
                WorkItemUserAuditAffectedColumns = string.Empty,
            });
        }

        /// <summary>Deterministic, human-readable Guid: entity-kind + id, e.g. 00000002-0000-0000-0000-000000000003.</summary>
        private static Guid MakeGuid(int id, int kind)
            => new($"{kind:00000000}-0000-0000-0000-{id:000000000000}");
    }
}
