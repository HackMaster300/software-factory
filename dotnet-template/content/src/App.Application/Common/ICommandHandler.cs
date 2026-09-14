namespace App.Application.Common;

public interface ICommandHandler<TCommand, TResult> {
    Task<TResult> HandleAsync(TCommand command, CancellationToken ct);
}