# Cookbook Front

Front da aplicação Cookbook. SPA em JavaScript puro (sem framework e sem build), com rotas por hash (`#/...`).

A API que este front consome está no repositório `cookbook-api`. A documentação da API externa (OCR.space) está no README de lá.

## Arquitetura

![Fluxograma da arquitetura: o usuário usa o cookbook-front no navegador; o front chama a cookbook-api por REST (GET, POST, PUT e DELETE); a API grava no SQLite e envia a imagem da receita ao OCR.space, que devolve o texto extraído.](docs/arquitetura.png)

O front só conversa com a `cookbook-api`. Quem chama o OCR.space é a API, que guarda a chave fora do navegador e devolve o texto extraído já como rascunho. O fonte do diagrama, em mermaid, está em `docs/arquitetura.mmd`.

> **Importação por foto precisa de uma chave do OCR.space.** Sem ela, todo o resto funciona, mas o botão **Enviar arquivo** responde com erro. A chave é gratuita: crie uma em https://ocr.space/ocrapi e coloque em `OCR_SPACE_API_KEY` no `.env` da `cookbook-api` (há um `.env.example` lá) antes de subir a API.

## Dependências

- Um navegador atual (Chrome, Firefox, Edge ou Safari).
- A `cookbook-api` rodando. Por padrão o front espera a API em `http://127.0.0.1:5000`.
- Nenhum pacote npm, bundler ou etapa de build.

## Configuração

Em `js/config.js`:

| Chave | Padrão | Uso |
| --- | --- | --- |
| `API_BASE_URL` | `http://127.0.0.1:5000` | Endereço da API. |
| `MAX_UPLOAD_BYTES` | `1048576` (1 MiB) | Tamanho máximo do arquivo na importação por foto. Deve ser igual ao `MAX_UPLOAD_BYTES` da API. |

## Executar

### Abrindo o arquivo

Abra `index.html` no navegador (duplo clique ou arraste o arquivo para uma aba). Com a API rodando em `API_BASE_URL`, a aplicação já funciona.

### Com um servidor local

O botão de copiar receita usa a API de área de transferência do navegador, que funciona melhor em `http://localhost` ou `https`. Para servir a pasta:

```bash
python3 -m http.server 8080
```

E acesse http://127.0.0.1:8080.

### Com Docker

O `Dockerfile` deste repositório serve os arquivos com nginx. O jeito mais simples de subir front e API juntos é o `docker-compose.yml` que está na raiz de `cookbook-api` (veja o README de lá). Para subir só o front:

```bash
docker build -t cookbook-front .
docker run --rm -p 8080:80 cookbook-front
```

## Funcionamento

Crie um cadastro na tela de login ou entre com um dos usuários de exemplo criados pelo `seed` da API (senha `cookbook123`):

- `maria@cookbook.dev`
- `joao@cookbook.dev`

| Página | Rota | O que faz |
| --- | --- | --- |
| Livro de Receitas | `#/` | Receitas do usuário, paginadas. |
| Rascunhos | `#/drafts` | Rascunhos importados por foto. Clicar no card abre a edição; a lixeira exclui. |
| Criar Receita | `#/create-recipe` | Importação por foto ou formulário manual. |
| Descobrir | `#/discover` | Receitas públicas de outros usuários, que podem ser salvas no próprio livro. |
| Receita | `#/recipe/<id>` | Detalhe da receita, com botão para copiar o texto para a área de transferência. |
| Editar receita | `#/edit-recipe/<id>` | Edição e exclusão de uma receita do próprio usuário. |
| Editar rascunho | `#/edit-draft/<id>` | Salvar o rascunho, transformá-lo em receita ou descartá-lo. |

### Importar uma receita por foto

1. Em **Criar Receita**, use **Enviar arquivo** e escolha um PNG, JPG ou PDF de até 1 MiB. Tipo e tamanho são conferidos antes do envio.
2. A API extrai o texto com o OCR.space e devolve um rascunho.
3. O formulário da mesma página é preenchido com o que voltou e a tela rola até ele.
4. Corrija o que for preciso e escolha:
   - **Salvar rascunho**, para continuar depois pela página Rascunhos;
   - **Criar Receita**, que cria a receita e apaga o rascunho.

### Copiar uma receita

Na página da receita, o ícone de copiar ao lado do título coloca o texto na área de transferência neste formato:

```text
Pão de Queijo da Vó

Ingredientes
- 500g de polvilho azedo
- 1 copo de leite

Modo de preparo
Ferva a água, o leite e o óleo.
```

## O que foi construído neste MVP

Já existia antes: login, cadastro, livro de receitas, criar, ver, editar e excluir receitas, e a página Descobrir.

Adicionado neste MVP:

- Importação de receita por foto na página Criar Receita.
- Página Rascunhos, com exclusão pelo card.
- Tela de edição compartilhada entre receita e rascunho, com **Salvar rascunho**, **Salvar receita** e **Descartar**.
- Botão de copiar receita para a área de transferência.
- Contador de caracteres nos campos com limite.
- Dockerfile.
