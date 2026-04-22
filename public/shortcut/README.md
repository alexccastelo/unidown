# Atalho "X-Down" para o macOS

Como o arquivo `.shortcut` do macOS precisa ser assinado pela conta iCloud de cada usuário, o jeito mais confiável é você criar o Atalho manualmente — leva ~90 segundos. Siga o passo-a-passo abaixo.

## Passo-a-passo

### 1. Abra o app **Atalhos** (Shortcuts.app)
Está em `Aplicativos > Atalhos` ou via Spotlight (`Cmd + Espaço` → "Atalhos").

### 2. Clique em **+** (novo atalho) no canto superior direito.

### 3. Nomeie como **X-Down**
No topo da janela do atalho, clique no nome e coloque `X-Down`.

### 4. Abra o painel de **Detalhes** (ícone ⓘ ou `Cmd + ⌥ + 2`)
Ative as opções:

- ✅ **Usar como Ação Rápida**
- ✅ **Menu de Compartilhamento**

Logo abaixo, em **Tipos de compartilhamento**, deixe marcado apenas:

- ✅ **URLs**
- ✅ **Páginas da Web no Safari**

Desmarque o resto.

### 5. Adicione as ações (duas)

**Ação 1 — URL**

1. Na barra de busca à direita, procure **URL** e arraste a ação "URL" para o canvas.
2. No campo da URL, digite:
   ```
   http://localhost:3000/?url=
   ```
3. **Sem apagar o que já está lá**, clique no final do campo e toque na variável **Entrada do Atalho** (aparece no teclado/autocompletar como chip azul). No macOS, você pode usar o menu "Selecionar Variável Mágica".
4. Clique no chip **Entrada do Atalho** que acabou de adicionar e escolha **Codificado em URL** (URL Encoded). Isso garante que caracteres especiais da URL do X não quebrem.

O campo deve ficar parecido com:

```
http://localhost:3000/?url=[Entrada do Atalho (Codificado em URL)]
```

**Ação 2 — Abrir URLs**

1. Procure **Abrir URLs** (Open URLs) na barra de busca.
2. Arraste para baixo da ação URL.
3. Confirme que a URL encadeada é a variável da ação anterior (por padrão já vem assim).

### 6. Feche o editor
O atalho é salvo automaticamente.

### 7. (Se for a primeira vez) autorize a extensão
Abra **Ajustes do Sistema → Privacidade e Segurança → Extensões → Compartilhamento** e marque **Atalhos**.

## Como usar

1. Rode o app: `pnpm dev` na pasta do projeto (precisa estar em `http://localhost:3000`).
2. No Safari, abra um tweet com vídeo.
3. Clique em **Compartilhar** → **X-Down**.
4. O navegador abre em `http://localhost:3000/?url=...` com o preview do vídeo.
5. Clique em **Baixar vídeo** — o arquivo vai para `~/Downloads`.

## Solução de problemas

- **Atalho não aparece em Compartilhar**: confirme que "Menu de Compartilhamento" está ativo nos Detalhes e que "URLs" está marcado. Abra também Ajustes do Sistema → Extensões → Compartilhamento e habilite Atalhos.
- **"Este tweet exige login"**: faça login em `https://x.com` no Safari. O backend usa `--cookies-from-browser safari` para autenticar.
- **localhost não responde**: verifique se `pnpm dev` está rodando na mesma máquina.

## Alternativa rápida (sem Atalho)

Cole a URL do tweet diretamente no campo da página inicial (`http://localhost:3000`). Funciona igual.
