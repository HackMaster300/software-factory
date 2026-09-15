# Imagens comprimidas

Todas as imagens em `wwwroot/images/` devem ser otimizadas antes do deploy:

- Converta para WebP/AVIF quando possível (`cwebp`, `sharp`, `squoosh`).
- Comprima SVGs com SVGO.
- Use `loading="lazy"` e `width`/`height` para evitar CLS.
- Exemplo: `og-image.svg` acima é vetorial (sem peso); para fotos, exporte em 1200×630 WebP &lt; 150KB.
