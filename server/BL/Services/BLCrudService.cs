using BL.Api;
using BL.Validation;
using DAL.Api;

namespace BL.Services;

/// <summary>
/// Generic business service: maps DAL entities to BL models, runs the entity's business rules
/// before every write, and turns "not found" into a domain exception.
/// </summary>
public abstract class BLCrudService<TBl, TDal>(ICrud<TDal> repository, string entityName) : IBLCrud<TBl>
    where TBl : class, new()
    where TDal : class, new()
{
    protected ICrud<TDal> Repository { get; } = repository;

    public async Task<List<TBl>> GetAllAsync() => (await Repository.GetAllAsync()).Select(ToBl).ToList();

    public async Task<TBl> GetByIdAsync(int id) =>
        ToBl(await Repository.GetByIdAsync(id) ?? throw new NotFoundException(entityName, id));

    public async Task<TBl> CreateAsync(TBl item)
    {
        Normalize(item);
        await ValidateAsync(item, isNew: true);
        return ToBl(await Repository.CreateAsync(ToDal(item)));
    }

    public async Task<TBl> UpdateAsync(int id, TBl item)
    {
        SetKey(item, id);
        _ = await Repository.GetByIdAsync(id) ?? throw new NotFoundException(entityName, id);
        Normalize(item);
        await ValidateAsync(item, isNew: false);
        await Repository.UpdateAsync(ToDal(item));
        return item;
    }

    public async Task DeleteAsync(int id)
    {
        await BeforeDeleteAsync(id);
        if (!await Repository.DeleteAsync(id)) throw new NotFoundException(entityName, id);
    }

    protected static TBl ToBl(TDal entity) => Mapper.Map<TDal, TBl>(entity);
    protected static TDal ToDal(TBl model) => Mapper.Map<TBl, TDal>(model);

    /// <summary>Writes the route id into the model's key property.</summary>
    protected abstract void SetKey(TBl item, int id);

    /// <summary>Fills derived / default values before validation.</summary>
    protected virtual void Normalize(TBl item) { }

    /// <summary>Entity-specific business rules. Throw <see cref="BusinessRuleException"/> to reject.</summary>
    protected virtual Task ValidateAsync(TBl item, bool isNew) => Task.CompletedTask;

    /// <summary>Referential checks before a delete (e.g. a family that still has students).</summary>
    protected virtual Task BeforeDeleteAsync(int id) => Task.CompletedTask;
}
