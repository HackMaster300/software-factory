# Software Factory — private `dotnet new` template (.NET 9 Clean API)

Golden path gerado pelo `ProjectService` (single source of truth).
`content/` é snapshot commitado; o teste `services/scaffoldDotnetNew.test.ts`
(drift guard) falha honestamente se o gerador mudar sem re-export.

## Install (privado, por máquina)

```bash
dotnet new install ./dotnet-template
dotnet new list sffactory-clean
```

## Uso

```bash
dotnet new sffactory-clean -n Minha.Empresa.Rpa
cd Minha.Empresa.Rpa
dotnet restore
dotnet build -c Release
dotnet test
```

`sourceName` (`Acme.Golden`) é renomeado para `-n` em arquivos e conteúdo
(`.sln`, `.code-workspace`, `README`). Namespaces `App.*` são preservados.

## Re-export após mudar o gerador

```bash
SF_EXPORT_TEMPLATE=./dotnet-template npm run test -- scaffoldDotnetNew -t "writes the pack"
```

## Uninstall

```bash
dotnet new uninstall ./dotnet-template
```
