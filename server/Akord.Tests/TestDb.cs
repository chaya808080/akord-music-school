using API.Infrastructure;
using BL;
using DAL;
using DAL.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Akord.Tests;

/// <summary>An isolated in-memory SQLite database with the real EF model and the demo seed.</summary>
public sealed class TestDb : IDisposable
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    public DbManager Db { get; }
    public BLManager BL { get; }

    private TestDb()
    {
        _connection.Open();
        Db = new DbManager(new DbContextOptionsBuilder<DbManager>().UseSqlite(_connection).Options);
        Db.Database.EnsureCreated();
        BL = new BLManager(new DalManager(Db));
    }

    public static async Task<TestDb> CreateSeededAsync()
    {
        var t = new TestDb();
        await DemoSeeder.SeedAsync(t.Db);
        t.Db.ChangeTracker.Clear();
        return t;
    }

    public static TestDb CreateEmpty() => new();

    public void Dispose()
    {
        Db.Dispose();
        _connection.Dispose();
    }
}
