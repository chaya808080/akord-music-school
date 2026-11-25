namespace BL.Api;

/// <summary>Async CRUD contract of the business layer. Every write goes through validation.</summary>
public interface IBLCrud<T> where T : class
{
    Task<List<T>> GetAllAsync();
    Task<T> GetByIdAsync(int id);
    Task<T> CreateAsync(T item);
    Task<T> UpdateAsync(int id, T item);
    Task DeleteAsync(int id);
}
