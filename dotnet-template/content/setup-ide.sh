#!/usr/bin/env bash
# Automatically generated IDE environment launcher script for Acme.Golden
echo "🚀 Initializing Acme.Golden IDE workspace..."
git init
echo "✅ Git repository initialized."
dotnet restore
echo "✅ Dependencies restored."
echo ""
echo "Open in your preferred IDE:"
echo " 1) VS Code:        code ."
echo " 2) VS Code Space:  code Acme.Golden.code-workspace"
echo " 3) Visual Studio:  devenv Acme.Golden.sln"
echo " 4) JetBrains:      rider Acme.Golden.sln"
