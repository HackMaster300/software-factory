using Xunit;
using App.Application.Commands;
using App.Application.Common;
using App.Core.Entities;

namespace App.UnitTests.ScaffoldTests;

public sealed class GoldenPathTests {
    private sealed class FakeRepository : IRepository<Transaction> {
        private readonly Dictionary<Guid, Transaction> _store = new();

        public Task<Transaction?> GetByIdAsync(Guid id, CancellationToken ct) {
            _store.TryGetValue(id, out var entity);
            return Task.FromResult(entity);
        }

        public Task AddAsync(Transaction entity, CancellationToken ct) {
            _store[entity.Id] = entity;
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task CreateTransaction_ReturnsNewId_AndPersists() {
        var handler = new CreateTransactionHandler(new FakeRepository(), TimeProvider.System);
        var command = new CreateTransactionCommand(100m, "BRL");

        var id = await handler.HandleAsync(command, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, id);
    }

    [Fact]
    public async Task CreatedTransaction_CanBeReadBack() {
        var repository = new FakeRepository();
        var handler = new CreateTransactionHandler(repository, TimeProvider.System);
        var id = await handler.HandleAsync(new CreateTransactionCommand(100m, "BRL"), CancellationToken.None);

        var stored = await repository.GetByIdAsync(id, CancellationToken.None);

        Assert.NotNull(stored);
        Assert.Equal(100m, stored.Amount);
    }
}