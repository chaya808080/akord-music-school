using BL.Api;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

/// <summary>
/// REST endpoints shared by every resource: GET (list / by id), POST, PUT and DELETE.
/// Business-rule and not-found errors are translated to ProblemDetails by <see cref="Infrastructure.ErrorHandler"/>.
/// </summary>
[ApiController]
[Produces("application/json")]
public abstract class CrudController<T>(IBLCrud<T> service) : ControllerBase where T : class
{
    [HttpGet]
    public Task<List<T>> GetAll() => service.GetAllAsync();

    [HttpGet("{id:int}")]
    public Task<T> Get(int id) => service.GetByIdAsync(id);

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<T>> Create(T item)
    {
        var created = await service.CreateAsync(item);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<T> Update(int id, T item) => service.UpdateAsync(id, item);

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(int id)
    {
        await service.DeleteAsync(id);
        return NoContent();
    }
}
