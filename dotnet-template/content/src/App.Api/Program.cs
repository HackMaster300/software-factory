using App.Application.Commands;
using App.Application.Common;
using App.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddHealthChecks().AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy());
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped(typeof(IRepository<>), typeof(InMemoryRepository<>));
builder.Services.AddScoped<ICommandHandler<CreateTransactionCommand, Guid>, CreateTransactionHandler>();

var app = builder.Build();
app.MapControllers();
app.MapHealthChecks("/healthz");
app.Run();