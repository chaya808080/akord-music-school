using API.Infrastructure;
using BL;
using DAL;
using DAL.Api;
using DAL.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<DbManager>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("Akord")));
builder.Services.AddScoped<IDal, DalManager>();
builder.Services.AddScoped<BLManager>();

builder.Services.AddControllers();
builder.Services.AddExceptionHandler<ErrorHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o => o.SwaggerDoc("v1", new() { Title = "Akord Music School API", Version = "v1" }));

var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

if (app.Configuration.GetValue<bool>("Database:CreateAndSeed"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<DbManager>();
    if (await db.Database.EnsureCreatedAsync()) await DemoSeeder.SeedAsync(db);
}

app.UseExceptionHandler();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseHttpsRedirection();
app.UseCors();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

/// <summary>Exposed for integration tests (WebApplicationFactory).</summary>
public partial class Program;
