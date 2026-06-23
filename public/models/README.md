# Modelos 3D (GLB) — Aethel Chimera

Solte aqui os arquivos **`.glb`** dos modelos 3D que serão incorporados ao site.

## Como incorporar um modelo

1. **Coloque o arquivo** nesta pasta, ex.: `public/models/arvore.glb`
   (fica acessível em runtime pela URL `/models/arvore.glb`).

2. **Registre** o modelo em `src/components/ImmersiveWorld.jsx`, na lista
   `GLB_MODELS` (descomente o exemplo e ajuste):

   ```js
   const GLB_MODELS = [
     { key: 'arvore', url: '/models/arvore.glb', section: 'catalogo',
       position: [0, -1, 0], scale: 0.6, rotation: [0, 0, 0] },
   ]
   ```

   - `url`        → caminho público do arquivo (sempre começa com `/models/...`)
   - `position`   → `[x, y, z]` no mundo 3D
   - `scale`      → número (uniforme) ou `[x, y, z]`
   - `rotation`   → `[x, y, z]` em radianos
   - `section`    → (opcional) só documenta a qual seção pertence

   O `<Suspense>` no Canvas carrega o GLB de forma assíncrona, e
   `useGLTF.preload()` já é chamado automaticamente para cada item registrado.

## Recomendações de exportação

- **Formato:** `.glb` (binário, um arquivo só — texturas embutidas).
- **Compressão:** ative **Draco** ou **Meshopt** no export (Blender: *glTF 2.0 →
  Compression*) para reduzir o tamanho. Se usar Draco, avise que eu habilito o
  decoder no loader.
- **Escala:** exporte em metros; ajuste fino com `scale` no registro.
- **Eixos:** Y para cima (padrão glTF).
- **Materiais:** PBR (Base Color / Metallic / Roughness). A cena já tem
  iluminação de ambiente (Environment) para refletir nos materiais.
- **Peso:** mire em poucos MB por modelo (idealmente < 5 MB) para não pesar no
  carregamento.

## Estado atual

Os efeitos 3D **procedurais** (DNA, sistema nervoso, árvore, folhas, cards do
catálogo) foram **removidos**. O único efeito de partículas que permanece é o
**logo da quimera** que se monta no final da página (contato/rodapé).

Esta pasta está **pronta** para receber os GLB — basta soltar e registrar.
