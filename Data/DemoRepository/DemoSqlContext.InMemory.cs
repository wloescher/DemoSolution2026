using Microsoft.EntityFrameworkCore;

namespace DemoRepository.Entities;

public partial class DemoSqlContext
{
    // The database views (ClientView, UserView, WorkItemView, ClientUserView, WorkItemUserView)
    // are mapped as [Keyless] / ToView entities. That is correct against SQL Server, but the EF Core
    // InMemory provider used by the test suite cannot track — and therefore cannot be seeded with —
    // keyless entity types ("Only entity types with a primary key may be tracked").
    //
    // This partial runs at the end of OnModelCreating. It is a no-op for every real provider
    // (SQL Server) and only takes effect for the InMemory provider, where it promotes each queried
    // view to a keyed entity using the view's naturally-unique id column so the tests can seed it.
    // The services query these views read-only, so the added key does not change their behavior.
    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        // Compare by provider name so this project need not reference the InMemory package.
        if (Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory")
        {
            return;
        }

        modelBuilder.Entity<ClientView>().HasKey(x => x.ClientId);
        modelBuilder.Entity<UserView>().HasKey(x => x.UserId);
        modelBuilder.Entity<WorkItemView>().HasKey(x => x.WorkItemId);
        modelBuilder.Entity<ClientUserView>().HasKey(x => x.ClientUserId);
        modelBuilder.Entity<WorkItemUserView>().HasKey(x => x.WorkItemUserId);
    }
}
