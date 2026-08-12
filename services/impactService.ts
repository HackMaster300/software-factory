import { AffectedComponentImpact } from '../types/factory';

export class ImpactService {
  static analyzeDatabaseChange(oldProvider: string, newProvider: string): AffectedComponentImpact[] {
    if (oldProvider === newProvider) return [];

    return [
      {
        type: 'ConnectionString',
        name: 'appsettings.json / .env',
        action: 'Modified',
        detail: `Replaced ConnectionStrings:${oldProvider} format with ${newProvider} host, port, username, password, and database schema connection string.`,
      },
      {
        type: 'Package',
        name: 'Infrastructure.csproj',
        action: 'Replaced',
        detail: `Removed ${oldProvider === 'SQL Server' ? 'Microsoft.EntityFrameworkCore.SqlServer' : 'Npgsql.EntityFrameworkCore.PostgreSQL'} and installed ${newProvider === 'PostgreSQL' ? 'Npgsql.EntityFrameworkCore.PostgreSQL v9.0.0' : 'Microsoft.EntityFrameworkCore.SqlServer v9.0.0'}.`,
      },
      {
        type: 'Docker',
        name: 'docker-compose.yml',
        action: 'Modified',
        detail: `Updated local container service definition from ${oldProvider === 'SQL Server' ? 'mcr.microsoft.com/mssql/server:2022-latest' : 'postgres:16-alpine'} to ${newProvider === 'PostgreSQL' ? 'postgres:16-alpine (port 5432)' : 'mcr.microsoft.com/mssql/server:2022-latest (port 1433)'}.`,
      },
      {
        type: 'HealthCheck',
        name: 'HealthCheckExtensions.cs',
        action: 'Modified',
        detail: `Updated AddHealthChecks() registration to probe ${newProvider} database health check endpoint.`,
      },
      {
        type: 'ORMProvider',
        name: 'ApplicationDbContext.cs',
        action: 'Modified',
        detail: `Updated DbContext OnConfiguring to call options.${newProvider === 'PostgreSQL' ? 'UseNpgsql' : 'UseSqlServer'}(connectionString).`,
      },
      {
        type: 'MigrationProject',
        name: 'src/Infrastructure/Migrations',
        action: 'Replaced',
        detail: `Re-generated Entity Framework Core migration snapshots formatted for ${newProvider} column types and indexing semantics.`,
      },
      {
        type: 'Documentation',
        name: 'README.md & Architecture.md',
        action: 'Modified',
        detail: `Updated local setup guide and database architecture diagram to reflect ${newProvider}.`,
      },
      {
        type: 'CodeFile',
        name: 'DependencyInjection.cs',
        action: 'Modified',
        detail: `Updated AddInfrastructureServices() DI extension method with ${newProvider} options.`,
      },
    ];
  }

  static analyzeFeatureToggle(featureName: string, isActivated: boolean): AffectedComponentImpact[] {
    if (featureName.toLowerCase().includes('docker')) {
      return [
        {
          type: 'Docker',
          name: 'Dockerfile & .dockerignore',
          action: isActivated ? 'Added' : 'Removed',
          detail: isActivated ? 'Generated multi-stage production container build script.' : 'Deleted Dockerfile from project root.',
        },
        {
          type: 'Docker',
          name: 'docker-compose.yml',
          action: isActivated ? 'Added' : 'Removed',
          detail: isActivated ? 'Generated local container orchestration file.' : 'Removed docker-compose.yml.',
        },
        {
          type: 'Documentation',
          name: 'Deployment.md',
          action: 'Modified',
          detail: 'Updated deployment instructions with container run commands.',
        },
      ];
    }

    return [
      {
        type: 'CodeFile',
        name: `Feature Module (${featureName})`,
        action: isActivated ? 'Added' : 'Removed',
        detail: `${isActivated ? 'Activated' : 'Deactivated'} ${featureName} dependency registrations and configuration files.`,
      },
      {
        type: 'Package',
        name: 'Project Dependencies',
        action: isActivated ? 'Added' : 'Removed',
        detail: `Updated solution package manifest for ${featureName}.`,
      },
    ];
  }
}
