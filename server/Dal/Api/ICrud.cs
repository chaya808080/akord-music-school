namespace DAL.Api;

/// <summary>Async CRUD contract shared by every repository in the data layer.</summary>
public interface ICrud<T> where T : class
{
    Task<List<T>> GetAllAsync();
    Task<T?> GetByIdAsync(int id);
    Task<T> CreateAsync(T item);
    Task UpdateAsync(T item);
    Task<bool> DeleteAsync(int id);
}
