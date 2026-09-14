using App.Core.Entities;

namespace App.Application.Common;

public interface IRepository<T> where T : BaseEntity {
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct);
    Task AddAsync(T entity, CancellationToken ct);
}