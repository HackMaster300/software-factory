import type { ProjectScaffoldContext, SolutionTreeNode } from './types';

/**
 * Static web assets (public/ or wwwroot/) for API and UI projects.
 * Extracted verbatim from ProjectService.generateSolutionPreview (indentation kept
 * so multi-line template literals stay byte-identical).
 */
export function addWebAssets(ctx: ProjectScaffoldContext): void {
  const { proj, lang, projectName, projFolderNode } = ctx;
      // outros → public/html genérico. Core/Application/Infrastructure/Tests/Worker não recebem.
      if (proj.type === 'API' || proj.type === 'UI') {
        const staticFolder = lang === 'csharp' ? 'wwwroot' : 'public';
        const checklist: Array<{ rel: string; language: string; snippet: string }> = (() => {
          if (lang === 'typescript') {
            // TypeScript — mantém checklist como estáticos em public (sem JSX) para compilar
            // tanto NestJS (backend) quanto Next.js (frontend) com tsc puro. TSX exigiria @types/react.
            return [
              {
                rel: `public/404.html`,
                language: 'html',
                snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>404 — ${projectName}</title></head><body><h1>404 — Página não encontrada</h1><a href="/">Voltar</a></body></html>`,
              },
              {
                rel: `public/seo/meta-title.html`,
                language: 'html',
                snippet: `<!-- Meta Title -->\n<title>${projectName} — Plataforma Enterprise</title>`,
              },
              {
                rel: `public/seo/meta-description.html`,
                language: 'html',
                snippet: `<meta name="description" content="${projectName}: solução padronizada com Clean Architecture.">`,
              },
              {
                rel: `public/components/cta-above-fold.html`,
                language: 'html',
                snippet: `<section><h1>${projectName}</h1><a href="#contact">Começar agora — CTA acima da dobra</a></section>`,
              },
              {
                rel: `public/favicon.svg`,
                language: 'xml',
                snippet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="16" fill="#2563eb"/><text x="50" y="58" text-anchor="middle" font-size="48" fill="white">${projectName.slice(0, 2).toUpperCase()}</text></svg>`,
              },
              {
                rel: `public/robots.txt`,
                language: 'plaintext',
                snippet: `User-agent: *\nAllow: /\nDisallow: /api/private/\nSitemap: /sitemap.xml`,
              },
              {
                rel: `public/sitemap.xml`,
                language: 'xml',
                snippet: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://example.com/</loc><priority>1.0</priority></url>\n</urlset>`,
              },
              {
                rel: `public/images/og-image.svg`,
                language: 'xml',
                snippet: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#0e1013"/><text x="600" y="300" text-anchor="middle" fill="white" font-size="56">${projectName}</text></svg>`,
              },
              {
                rel: `public/components/image-alt-example.html`,
                language: 'html',
                snippet: `<img src="/images/og-image.svg" alt="Banner Open Graph do ${projectName}" width="1200" height="630" loading="lazy">`,
              },
              {
                rel: `public/css/breakpoints.css`,
                language: 'css',
                snippet: `.container { max-width: 1120px; margin: 0 auto; }\n@media (min-width: 640px) { .container { padding: 0 1.5rem; } }`,
              },
              {
                rel: `public/components/fixed-cta-mobile.html`,
                language: 'html',
                snippet: `<a href="#contact" class="fixed-cta-mobile">Fale connosco — CTA fixo mobile</a>`,
              },
              {
                rel: `public/components/loading.html`,
                language: 'html',
                snippet: `<div aria-busy="true">A carregar…</div>`,
              },
              {
                rel: `public/components/error.html`,
                language: 'html',
                snippet: `<div role="alert">Erro ao carregar</div>`,
              },
              {
                rel: `public/thank-you.html`,
                language: 'html',
                snippet: `<h1>Obrigado!</h1><p>Recebemos o seu contacto.</p>`,
              },
              {
                rel: `public/privacy.html`,
                language: 'html',
                snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Privacidade — ${projectName}</title></head><body><h1>Política de Privacidade</h1><p>Exemplo LGPD.</p></body></html>`,
              },
              {
                rel: `public/terms.html`,
                language: 'html',
                snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Termos — ${projectName}</title></head><body><h1>Termos</h1><p>Exemplo de termos.</p></body></html>`,
              },
              {
                rel: `public/components/cookie-banner.html`,
                language: 'html',
                snippet: `<div role="dialog" aria-label="cookies">Usamos cookies. <a href="/privacy.html">Saiba mais</a></div>`,
              },
              {
                rel: `public/js/analytics.js`,
                language: 'javascript',
                snippet: `var GA_ID='G-XXXXXXX';`,
              },
              {
                rel: `public/contact.html`,
                language: 'html',
                snippet: `<address>Av. Paulista, 1000 — São Paulo<br>contact@example.com</address>`,
              },
              {
                rel: `public/images/README-compressed.md`,
                language: 'markdown',
                snippet: `# Imagens comprimidas\n\nOtimize WebP/AVIF.\n`,
              },
            ];
          }
          // csharp e fallback genérico (html sob wwwroot/public)
          return [
          {
            rel: `${staticFolder}/404.html`,
            language: 'html',
            snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>404 — Página não encontrada | ${projectName}</title><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main style="max-width:600px;margin:4rem auto;text-align:center;font-family:system-ui"><h1>404 — Página não encontrada</h1><p>A página que procura não existe ou foi movida.</p><a href="/" style="display:inline-block;margin-top:1rem;padding:0.6rem 1.2rem;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Voltar ao início</a></main></body></html>`,
          },
          {
            rel: `${staticFolder}/seo/meta-title.html`,
            language: 'html',
            snippet: `<!-- Meta Title — inclua no <head> de cada página -->\n<title>${projectName} — Plataforma Enterprise</title>`,
          },
          {
            rel: `${staticFolder}/seo/meta-description.html`,
            language: 'html',
            snippet: `<!-- Meta Description — 150-160 chars -->\n<meta name="description" content="${projectName}: solução padronizada com Clean Architecture, observabilidade e segurança enterprise.">`,
          },
          {
            rel: `${staticFolder}/components/cta-above-fold.html`,
            language: 'html',
            snippet: `<section style="padding:3rem 1rem;text-align:center"><h1>${projectName}</h1><p>Solução padronizada pronta para produção.</p><a href="#contact" style="display:inline-block;padding:0.75rem 1.5rem;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none">Começar agora — CTA acima da dobra</a></section>`,
          },
          {
            rel: `${staticFolder}/favicon.svg`,
            language: 'xml',
            snippet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="16" fill="#2563eb"/><text x="50" y="58" text-anchor="middle" font-size="48" fill="white" font-family="system-ui">${projectName.slice(0, 2).toUpperCase()}</text></svg>`,
          },
          {
            rel: `${staticFolder}/robots.txt`,
            language: 'plaintext',
            snippet: `User-agent: *\nAllow: /\nDisallow: /api/private/\nSitemap: /sitemap.xml`,
          },
          {
            rel: `${staticFolder}/sitemap.xml`,
            language: 'xml',
            snippet: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://example.com/</loc><priority>1.0</priority></url>\n  <url><loc>https://example.com/contact</loc><priority>0.8</priority></url>\n  <url><loc>https://example.com/privacy</loc><priority>0.3</priority></url>\n</urlset>`,
          },
          {
            rel: `${staticFolder}/images/og-image.svg`,
            language: 'xml',
            snippet: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#0e1013"/><rect x="40" y="40" width="1120" height="550" rx="24" fill="#1a1d26" stroke="#2e3342"/><text x="600" y="300" text-anchor="middle" font-size="56" fill="white" font-family="system-ui">${projectName}</text><text x="600" y="360" text-anchor="middle" font-size="24" fill="#9aa1b8" font-family="system-ui">Open Graph • 1200×630</text></svg>`,
          },
          {
            rel: `${staticFolder}/components/image-alt-example.html`,
            language: 'html',
            snippet: `<!-- Todas as imagens com alt descritivo -->\n<img src="/images/og-image.svg" alt="Banner Open Graph do ${projectName} — ilustração da plataforma" width="1200" height="630" loading="lazy">`,
          },
          {
            rel: `${staticFolder}/css/breakpoints.css`,
            language: 'css',
            snippet: `/* Breakpoints móveis — mobile-first */\n:root { --content-max: 1120px; }\n.container { max-width: var(--content-max); margin: 0 auto; padding: 0 1rem; }\n@media (min-width: 640px) { .container { padding: 0 1.5rem; } }\n@media (min-width: 1024px) { .container { padding: 0 2rem; } }\n@media (min-width: 1280px) { .container { max-width: 1280px; } }`,
          },
          {
            rel: `${staticFolder}/components/fixed-cta-mobile.html`,
            language: 'html',
            snippet: `<!-- CTA fixo mobile — aparece só abaixo de 768px -->\n<a href="#contact" class="fixed-cta-mobile" style="position:fixed;bottom:1rem;left:1rem;right:1rem;display:block;padding:1rem;background:#2563eb;color:#fff;text-align:center;border-radius:12px;text-decoration:none;box-shadow:0 8px 24px rgba(0,0,0,0.3)">Fale connosco — CTA fixo mobile</a>\n<style>@media (min-width: 768px) { .fixed-cta-mobile { display:none; } }</style>`,
          },
          {
            rel: `${staticFolder}/components/loading.html`,
            language: 'html',
            snippet: `<!-- Estados de carregamento — skeleton -->\n<div aria-busy="true" aria-label="A carregar"><div style="height:1rem;background:#e5e7eb;border-radius:4px;animation:pulse 1.5s infinite"></div><div style="height:1rem;background:#e5e7eb;border-radius:4px;margin-top:0.5rem;animation:pulse 1.5s infinite 0.2s"></div></div>\n<style>@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }</style>`,
          },
          {
            rel: `${staticFolder}/components/error.html`,
            language: 'html',
            snippet: `<!-- Estados de erro — acessível -->\n<div role="alert" style="padding:1rem;border:1px solid #fca5a5;background:#fef2f2;border-radius:8px;color:#991b1b"><strong>Erro ao carregar</strong><p>Tente novamente em alguns segundos.</p><button onclick="location.reload()" style="margin-top:0.5rem;padding:0.5rem 1rem;background:#dc2626;color:#fff;border-radius:6px;border:0">Tentar novamente</button></div>`,
          },
          {
            rel: `${staticFolder}/thank-you.html`,
            language: 'html',
            snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Obrigado — ${projectName}</title></head><body><main style="max-width:600px;margin:4rem auto;text-align:center"><h1>Obrigado!</h1><p>Recebemos o seu contacto. Responderemos em até 1 dia útil.</p><a href="/">Voltar ao início</a></main></body></html>`,
          },
{
              rel: `${staticFolder}/privacy.html`,
              language: 'html',
              snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Política de Privacidade — ${projectName}</title><meta name="robots" content="noindex"></head><body><main style="max-width:720px;margin:2rem auto;padding:0 1rem"><h1>Política de Privacidade</h1><p>Esta é uma página de exemplo. Substitua pelo texto jurídico real conforme LGPD/GDPR.</p><p>Última atualização: {{LAST_UPDATED}}</p></main></body></html>`,
          },
          {
            rel: `${staticFolder}/terms.html`,
            language: 'html',
            snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Termos e Condições — ${projectName}</title><meta name="robots" content="noindex"></head><body><main style="max-width:720px;margin:2rem auto;padding:0 1rem"><h1>Termos e Condições</h1><p>Exemplo de termos. Substitua pelo documento jurídico real.</p></main></body></html>`,
          },
          {
            rel: `${staticFolder}/components/cookie-banner.html`,
            language: 'html',
            snippet: `<!-- Banner de cookies — LGPD -->\n<div id="cookie-banner" role="dialog" aria-label="Consentimento de cookies" style="position:fixed;bottom:0;left:0;right:0;padding:1rem;background:#111827;color:#fff;display:flex;gap:1rem;align-items:center;justify-content:space-between"><span>Usamos cookies para analytics e melhoria contínua. <a href="/privacy.html" style="color:#93c5fd">Saiba mais</a></span><button onclick="document.getElementById('cookie-banner').remove()" style="padding:0.5rem 1rem;background:#2563eb;color:#fff;border:0;border-radius:6px">Aceitar</button></div>`,
          },
          {
            rel: `${staticFolder}/js/analytics.js`,
            language: 'javascript',
            snippet: `// Analytics — substitua GA_ID pelo ID real (ex. G-XXXX) e carregue apenas após consentimento.\n(function(){ var GA_ID = 'G-XXXXXXX'; var s=document.createElement('script'); s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+GA_ID; document.head.appendChild(s); window.dataLayer=window.dataLayer||[]; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', GA_ID, { anonymize_ip: true }); })();`,
          },
          {
            rel: `${staticFolder}/contact.html`,
            language: 'html',
            snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Contacto — ${projectName}</title></head><body><main style="max-width:600px;margin:2rem auto;padding:0 1rem"><h1>Contacto</h1><address style="font-style:normal;line-height:1.6"><strong>${projectName}</strong><br>Av. Paulista, 1000 — São Paulo, SP — 01310-100 — Brasil<br>Email: <a href="mailto:contact@example.com">contact@example.com</a><br>Tel: +55 11 99999-0000</address></main></body></html>`,
          },
          {
            rel: `${staticFolder}/images/README-compressed.md`,
            language: 'markdown',
            snippet: `# Imagens comprimidas\n\nTodas as imagens em \`${staticFolder}/images/\` devem ser otimizadas antes do deploy:\n\n- Converta para WebP/AVIF quando possível (\`cwebp\`, \`sharp\`, \`squoosh\`).\n- Comprima SVGs com SVGO.\n- Use \`loading="lazy"\` e \`width\`/\`height\` para evitar CLS.\n- Exemplo: \`og-image.svg\` acima é vetorial (sem peso); para fotos, exporte em 1200×630 WebP &lt; 150KB.\n`,
          },
        ];
      })();
        for (const item of checklist) {
          // Phase 19: respeita o path base já corrigido (Dart usa lib/... sem src/).
          const basePath = projFolderNode.path;
          const fullPath = `${basePath}/${item.rel}`;
          const parts = item.rel.split('/');
          const fileName = parts.pop()!;
          let cursor: SolutionTreeNode[] = projFolderNode.children!;
          let curPath = basePath;
          for (const part of parts) {
            curPath = `${curPath}/${part}`;
            let folder = cursor.find((n) => n.path === curPath);
            if (!folder) {
              folder = { id: `dir-${curPath}`, name: part, type: 'folder', path: curPath, children: [] };
              cursor.push(folder);
            }
            cursor = folder.children!;
          }
          if (!cursor.some((n) => n.path === fullPath)) {
            cursor.push({
              id: `checklist-${proj.id}-${item.rel}`,
              name: fileName,
              type: 'file',
              path: fullPath,
              language: item.language,
              contentSnippet: item.snippet,
            });
          }
        }
      }
}
