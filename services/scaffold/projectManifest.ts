import type { ProjectScaffoldContext } from './types';

/**
 * Per-module manifest (.csproj / pom.xml / Cargo.toml / ...), tsconfig for TypeScript and real test stubs.
 * Extracted verbatim from ProjectService.generateSolutionPreview (indentation kept
 * so multi-line template literals stay byte-identical).
 */
export function addProjectManifestAndTests(ctx: ProjectScaffoldContext): void {
  const { blueprint, proj, lang, manifestPackages, projFolderNode } = ctx;
      // Module manifest file (e.g., .csproj, Cargo.toml, package.json)
      const refXml = proj.references.map((rId) => {
        const refProj = blueprint.projects.find((p) => p.id === rId);
        return refProj ? `    <ProjectReference Include="..\\${refProj.name}\\${refProj.name}.csproj" />` : '';
      }).filter(Boolean).join('\n');

      // Phase 12: manifest usa pacotes do módulo + injetados das Features (não só do módulo).
      const effectivePackages = manifestPackages.get(proj.id) || [];
      const pkgXml = effectivePackages.map((p) => `    <PackageReference Include="${p.name}" Version="${p.version}" />`).join('\n');
      // Phase 9: Tests C# ganham xUnit real (restore via NuGet); Api usa Sdk.Web (Program.cs).
      const testPkgs = lang === 'csharp' && proj.type === 'Tests'
        ? `\n    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.11.0" />\n    <PackageReference Include="xunit" Version="2.9.2" />\n    <PackageReference Include="xunit.runner.visualstudio" Version="2.8.2" />`
        : '';
      const allPkgs = [pkgXml, testPkgs].filter(Boolean).join('\n');

      // Phase 19: manifest por linguagem; go/dart usam o manifest raiz (go.mod/pubspec)
      // em vez de package.json errado por módulo.
      const projManifestFileName =
        lang === 'csharp' ? `${proj.name}.csproj` :
        lang === 'python' ? 'pyproject.toml' :
        lang === 'java' ? 'pom.xml' :
        lang === 'rust' ? 'Cargo.toml' :
        lang === 'kotlin' ? 'build.gradle.kts' :
        lang === 'go' ? null :
        lang === 'dart' ? null :
        'package.json';
      const sdk = lang === 'csharp' && proj.type === 'API' ? 'Microsoft.NET.Sdk.Web' : 'Microsoft.NET.Sdk';
      const projManifestSnippet = (() => {
        if (lang === 'csharp') {
          return `<Project Sdk="${sdk}">\n  <PropertyGroup>\n    <TargetFramework>net9.0</TargetFramework>\n    <ImplicitUsings>enable</ImplicitUsings>\n    <Nullable>enable</Nullable>\n  </PropertyGroup>\n\n  <ItemGroup>\n${refXml || '    <!-- No Outbound Project References -->'}\n  </ItemGroup>\n\n  <ItemGroup>\n${allPkgs || '    <!-- Core Packages -->'}\n  </ItemGroup>\n</Project>`;
        }
        if (lang === 'python') {
          const deps = effectivePackages.length > 0
            ? effectivePackages.map((p) => `${p.name} = "^${p.version}"`).join('\n')
            : 'fastapi = "^0.111.0"\nuvicorn = "^0.30.0"\npydantic = "^2.0.0"';
          return `[tool.poetry]\nname = "${proj.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}"\nversion = "0.1.0"\n\n[tool.poetry.dependencies]\npython = "^3.12"\n${deps}\n\n[build-system]\nrequires = ["poetry-core"]\nbuild-backend = "poetry.core.masonry.api"\n`;
        }
        if (lang === 'java') {
          // Phase 19: pom por módulo (Java 21). Deps Maven no formato group:artifact.
          const depsXml = effectivePackages.map((p) => {
            const parts = p.name.split(':');
            const groupId = parts.length > 1 ? parts.slice(0, -1).join(':') : 'org.example';
            const artifactId = parts.length > 1 ? parts[parts.length - 1] : p.name;
            return `    <dependency>\n      <groupId>${groupId}</groupId>\n      <artifactId>${artifactId}</artifactId>\n      <version>${p.version}</version>\n    </dependency>`;
          }).join('\n');
          const artifact = proj.name.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
          // Phase 20: sourceDirectory=. porque os .java ficam na raiz do módulo
          // (não em src/main/java). Compila os arquivos gerados em vez de um jar vazio.
          return `<project xmlns="http://maven.apache.org/POM/4.0.0">\n  <modelVersion>4.0.0</modelVersion>\n  <groupId>com.acme</groupId>\n  <artifactId>${artifact}</artifactId>\n  <version>1.0.0</version>\n  <packaging>jar</packaging>\n  <properties>\n    <maven.compiler.source>21</maven.compiler.source>\n    <maven.compiler.target>21</maven.compiler.target>\n    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>\n  </properties>\n  <build>\n    <sourceDirectory>.</sourceDirectory>\n  </build>\n  <dependencies>\n${depsXml || '    <!-- module dependencies -->'}\n  </dependencies>\n</project>`;
        }
        if (lang === 'rust') {
          // Phase 19: Cargo.toml por crate (sem workspace — cada crate compila sozinha).
          return `[package]\nname = "${proj.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\n`;
        }
        if (lang === 'kotlin') {
          // Phase 19/20: build.gradle.kts por módulo (Kotlin JVM). sourceSets aponta para
          // a raiz do módulo porque os .kt ficam ao lado do manifest (não em src/main/kotlin).
          return `plugins {\n    kotlin("jvm") version "2.0.0"\n    application\n}\n\nrepositories {\n    mavenCentral()\n}\n\nsourceSets {\n    main {\n        kotlin.srcDir(".")\n    }\n}\n\ndependencies {\n    implementation(kotlin("stdlib"))\n}\n\ntasks.test {\n    useJUnitPlatform()\n}\n`;
        }
        return `{\n  "name": "${proj.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}",\n  "version": "1.0.0",\n  "type": "commonjs",\n  "scripts": {\n    "build": "tsc --noEmit",\n    "test": "echo \\"No tests specified\\" && exit 0"\n  },\n  "dependencies": {\n${effectivePackages.map((p) => `    "${p.name}": "${p.version}"`).join(',\n')}\n  },\n  "devDependencies": {\n    "typescript": "^5.9.0"\n  }\n}`;
      })();

      // Phase 19: go/dart não têm manifest por módulo (go.mod/pubspec na raiz).
      if (projManifestFileName !== null) {
        const manifestLang =
          lang === 'csharp' || lang === 'java' ? 'xml' :
          lang === 'python' || lang === 'rust' ? 'toml' :
          lang === 'kotlin' ? 'kotlin' : 'json';
        projFolderNode.children?.unshift({
          id: `file-proj-manifest-${proj.id}`,
          name: projManifestFileName,
          type: 'file',
          path: `src/${proj.name}/${projManifestFileName}`,
          language: manifestLang,
          contentSnippet: projManifestSnippet,
        });
      }

      // Phase 15: TypeScript precisa de tsconfig.json para compilar (tsc --noEmit)
      if (lang === 'typescript') {
        projFolderNode.children?.push({
          id: `file-tsconfig-${proj.id}`,
          name: 'tsconfig.json',
          type: 'file',
          path: `src/${proj.name}/tsconfig.json`,
          language: 'json',
          contentSnippet: `{\n  "compilerOptions": {\n    "target": "ES2020",\n    "module": "commonjs",\n    "moduleResolution": "node",\n    "strict": true,\n    "esModuleInterop": true,\n    "skipLibCheck": true,\n    "forceConsistentCasingInFileNames": true,\n    "jsx": "react-jsx",\n    "outDir": "dist",\n    "rootDir": ".",\n    "declaration": false\n  },\n  "include": ["**/*.ts", "**/*.tsx"],\n  "exclude": ["node_modules", "dist"]\n}`,
        });
      }

      // Phase 9/15: teste real por stack — C# usa xUnit, TypeScript usa vitest-like stub que compila com tsc
      if (proj.type === 'Tests') {
        if (lang === 'csharp') {
          const appName3 = blueprint.projects.find((p) => p.type === 'Application')?.name || 'App.Application';
          const coreName3 = blueprint.projects.find((p) => p.type === 'Core')?.name || 'App.Core';
          projFolderNode.children?.push({
            id: `dir-${proj.id}-scaffold-tests`,
            name: 'ScaffoldTests',
            type: 'folder',
            path: `src/${proj.name}/ScaffoldTests`,
            children: [
              {
                id: 'file-scaffold-tests',
                name: 'GoldenPathTests.cs',
                type: 'file',
                path: `src/${proj.name}/ScaffoldTests/GoldenPathTests.cs`,
                language: 'csharp',
                contentSnippet:
                  `using Xunit;\nusing ${appName3}.Commands;\nusing ${appName3}.Common;\nusing ${coreName3}.Entities;\n\nnamespace ${proj.name}.ScaffoldTests;\n\npublic sealed class GoldenPathTests {\n    private sealed class FakeRepository : IRepository<Transaction> {\n        private readonly Dictionary<Guid, Transaction> _store = new();\n\n        public Task<Transaction?> GetByIdAsync(Guid id, CancellationToken ct) {\n            _store.TryGetValue(id, out var entity);\n            return Task.FromResult(entity);\n        }\n\n        public Task AddAsync(Transaction entity, CancellationToken ct) {\n            _store[entity.Id] = entity;\n            return Task.CompletedTask;\n        }\n    }\n\n    [Fact]\n    public async Task CreateTransaction_ReturnsNewId_AndPersists() {\n        var handler = new CreateTransactionHandler(new FakeRepository(), TimeProvider.System);\n        var command = new CreateTransactionCommand(100m, "BRL");\n\n        var id = await handler.HandleAsync(command, CancellationToken.None);\n\n        Assert.NotEqual(Guid.Empty, id);\n    }\n\n    [Fact]\n    public async Task CreatedTransaction_CanBeReadBack() {\n        var repository = new FakeRepository();\n        var handler = new CreateTransactionHandler(repository, TimeProvider.System);\n        var id = await handler.HandleAsync(new CreateTransactionCommand(100m, "BRL"), CancellationToken.None);\n\n        var stored = await repository.GetByIdAsync(id, CancellationToken.None);\n\n        Assert.NotNull(stored);\n        Assert.Equal(100m, stored.Amount);\n    }\n}`,
              },
            ],
          });
        } else if (lang === 'typescript') {
          projFolderNode.children?.push({
            id: `file-test-${proj.id}`,
            name: 'example.test.ts',
            type: 'file',
            path: `src/${proj.name}/example.test.ts`,
            language: 'typescript',
            contentSnippet: `// Scaffold smoke test — valid TypeScript without external deps (vitest not required at tsc time)\nexport function exampleTest(): boolean {\n  return 1 + 1 === 2;\n}\n`,
          });
        }
      }

      // Phase 14/15: 20 itens de checklist web — apenas para projetos web (API/UI).
      // Refinado por framework: csharp → wwwroot/html, typescript → public + src/components/*.tsx,
}
