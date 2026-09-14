using App.Application.Commands;
using App.Application.Common;
using App.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using FluentValidation;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddHealthChecks().AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy());
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped(typeof(IRepository<>), typeof(InMemoryRepository<>));
builder.Services.AddScoped<ICommandHandler<CreateTransactionCommand, Guid>, CreateTransactionHandler>();
builder.Services.AddDbContext<ApplicationDbContext>(o => o.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Host=localhost;Database=appdb;Username=appuser;Password=appsecret"));
builder.Services.AddStackExchangeRedisCache(o => o.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddAuthorization();
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<CreateTransactionCommand>());
builder.Services.AddValidatorsFromAssemblyContaining<CreateTransactionCommand>();
builder.Services.AddOpenTelemetry();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/healthz");
app.Run();