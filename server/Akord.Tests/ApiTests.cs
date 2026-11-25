using System.Net;
using System.Net.Http.Json;
using API.Infrastructure;
using DAL.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace Akord.Tests;

/// <summary>Runs the real ASP.NET Core pipeline (routing, controllers, error handling) over SQLite.</summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<DbManager>>();
            services.AddDbContext<DbManager>(o => o.UseSqlite(_connection));
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        _connection.Open();
        var host = base.CreateHost(builder);
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DbManager>();
        db.Database.EnsureCreated();
        DemoSeeder.SeedAsync(db).GetAwaiter().GetResult();
        return host;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        _connection.Dispose();
    }
}

public class ApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _http = factory.CreateClient();

    [Theory]
    [InlineData("/api/students")]
    [InlineData("/api/families")]
    [InlineData("/api/teachers")]
    [InlineData("/api/courses")]
    [InlineData("/api/enrollments")]
    [InlineData("/api/lessons")]
    [InlineData("/api/waiting-list")]
    [InlineData("/api/stats/dashboard")]
    [InlineData("/health")]
    public async Task Endpoints_respond(string url) =>
        Assert.Equal(HttpStatusCode.OK, (await _http.GetAsync(url)).StatusCode);

    [Fact]
    public async Task Business_rule_violation_returns_problem_details()
    {
        var response = await _http.PostAsJsonAsync("/api/courses", new { nameOfCourse = "", sexOfCourse = "מעורב", priceOfCourse = 100 });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Equal("שם הקורס הוא שדה חובה", problem!.Title);
    }

    [Fact]
    public async Task Missing_entity_returns_404()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _http.GetAsync("/api/students/987654")).StatusCode);
    }

    [Fact]
    public async Task Course_crud_round_trip()
    {
        var created = await _http.PostAsJsonAsync("/api/courses", new { nameOfCourse = "סקסופון", sexOfCourse = "מעורב", priceOfCourse = 340, fromAge = 10, toAge = 18 });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var course = await created.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        var id = int.Parse(course!["codeOfCourse"].ToString()!);

        var updated = await _http.PutAsJsonAsync($"/api/courses/{id}", new { nameOfCourse = "סקסופון", sexOfCourse = "מעורב", priceOfCourse = 360 });
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await _http.DeleteAsync($"/api/courses/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _http.GetAsync($"/api/courses/{id}")).StatusCode);
    }
}
