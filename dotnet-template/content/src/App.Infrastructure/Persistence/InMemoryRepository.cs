using App.Application.Common;
using App.Core.Entities;
using System.Collections.Concurrent;

namespace App.Infrastructure.Persistence;

public sealed class InMemoryRepository<T> : IRepository<T> where T : BaseEntity {
    private readonly ConcurrentDictionary<Guid, T> _store = new();

    public Task<T?> GetByIdAsync(Guid id, CancellationToken ct) {
        _store.TryGetValue(id, out var entity);
        return Task.FromResult(entity);
    }

    public Task AddAsync(T entity, CancellationToken ct) {
        _store[entity.Id] = entity;
        return Task.CompletedTask;
    }
}