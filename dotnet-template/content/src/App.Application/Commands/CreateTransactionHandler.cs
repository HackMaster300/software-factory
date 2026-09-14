using App.Core.Entities;
using App.Application.Common;

namespace App.Application.Commands;

public sealed class CreateTransactionHandler : ICommandHandler<CreateTransactionCommand, Guid> {
    private readonly IRepository<Transaction> _repository;
    private readonly TimeProvider _time;

    public CreateTransactionHandler(IRepository<Transaction> repository, TimeProvider time) {
        _repository = repository;
        _time = time;
    }

    public async Task<Guid> HandleAsync(CreateTransactionCommand command, CancellationToken ct) {
        var entity = new Transaction {
            Id = Guid.NewGuid(),
            Amount = command.Amount,
            Currency = command.Currency,
            CreatedAt = _time.GetUtcNow(),
        };
        await _repository.AddAsync(entity, ct);
        return entity.Id;
    }
}