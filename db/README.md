# BD Local com Docker — SQL Server 2022 + SSMS

Este projeto sobe um **SQL Server 2022 Developer** local via Docker para simular algo real, com a **mesma modelagem** do Postgres/SQLite da factory. A app Next.js continua em **SQLite** (`lib/sql.ts`, zero deps) até o driver `mssql` ser instalado — a BD Docker é para inspeção via **SSMS** e validação do schema/connection strings.

## Subir

```bash
# 1) Defina a senha do sa (opcional — default é Factory123!)
# Linux/macOS
export MSSQL_SA_PASSWORD='SuaSenhaForte123!'
# Windows PowerShell
$env:MSSQL_SA_PASSWORD='SuaSenhaForte123!'

# 2) Suba só a BD (sem a app)
docker compose up -d mssql

# 3) Ou tudo (app + BD)
docker compose up -d --build
```

No primeiro start o `db/schema-mssql.sql` é aplicado automaticamente (cria database `factory` e 6 tabelas). O volume `mssqldata` persiste os dados.

## Conectar no SSMS

- **Server type:** Database Engine
- **Server name:** `localhost,1433`
- **Authentication:** SQL Server Authentication
- **Login:** `sa`
- **Password:** valor de `MSSQL_SA_PASSWORD` (default `Factory123!`)
- **Options > Connection Properties:** `Trust server certificate` = true
- **Database:** `factory`

Teste rápido (sqlcmd no host ou no container):

```bash
# sqlcmd v18 dentro do container (com -C = TrustServerCertificate)
docker compose exec mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'Factory123!' -C -d factory -Q "SELECT name FROM sys.tables; SELECT COUNT(*) AS organizations FROM organizations;"
```

## Connection strings

- **SSMS / host:** `Server=localhost,1433;Database=factory;User Id=sa;Password=Factory123!;TrustServerCertificate=True;`
- **Dentro do compose (app → mssql):** `Server=mssql,1433;Database=factory;User Id=sa;Password=${MSSQL_SA_PASSWORD};TrustServerCertificate=True;`
- **.env:** `MSSQL_CONNECTION_STRING` e `MSSQL_SA_PASSWORD` (ver `.env.example`).

## Postgres (alternativa)

O `db/schema.sql` (Postgres) continua no repo. Para usar Postgres em vez de MSSQL: no `docker-compose.yml` comente o serviço `mssql` e descomente o `db` (postgres).

## Verificação

```bash
docker compose config --quiet && echo "compose ok"
docker compose ps
npm run build
npm run test
```

## Limpar

```bash
docker compose down
# com dados (apaga o volume mssqldata):
docker compose down -v
```
