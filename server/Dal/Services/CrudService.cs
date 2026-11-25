using DAL.Api;
using DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace DAL.Services;

/// <summary>
/// Generic EF Core repository. The primary key is discovered from the EF model,
/// so one implementation serves all 13 tables.
/// </summary>
public abstract class CrudService<T> : ICrud<T> where T : class
{
    protected readonly DbManager Db;
    private readonly IProperty _key;

    protected CrudService(DbManager db)
    {
        Db = db;
        _key = db.Model.FindEntityType(typeof(T))!.FindPrimaryKey()!.Properties.Single();
    }

    protected DbSet<T> Set => Db.Set<T>();

    public Task<List<T>> GetAllAsync() => Set.AsNoTracking().ToListAsync();

    public async Task<T?> GetByIdAsync(int id)
    {
        var entity = await Set.FindAsync(id);
        if (entity != null) Db.Entry(entity).State = EntityState.Detached;
        return entity;
    }

    public async Task<T> CreateAsync(T item)
    {
        // Some legacy tables don't use IDENTITY - allocate the next key ourselves.
        if (_key.ValueGenerated == ValueGenerated.Never && (int)KeyOf(item) == 0)
        {
            var max = await Set.Select(e => (int?)EF.Property<int>(e, _key.Name)).MaxAsync() ?? 0;
            _key.PropertyInfo!.SetValue(item, max + 1);
        }

        Set.Add(item);
        try
        {
            await Db.SaveChangesAsync();
        }
        catch
        {
            Db.Entry(item).State = EntityState.Detached; // keep the context clean after a failed insert
            throw;
        }
        Db.Entry(item).State = EntityState.Detached;
        return item;
    }

    public async Task UpdateAsync(T item)
    {
        var existing = await Set.FindAsync(KeyOf(item))
            ?? throw new KeyNotFoundException($"{typeof(T).Name} {KeyOf(item)} was not found");
        Db.Entry(existing).CurrentValues.SetValues(item);
        await Db.SaveChangesAsync();
        Db.Entry(existing).State = EntityState.Detached;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await Set.FindAsync(id);
        if (existing == null) return false;
        Set.Remove(existing);
        await Db.SaveChangesAsync();
        return true;
    }

    private object KeyOf(T item) => _key.PropertyInfo!.GetValue(item)!;
}
