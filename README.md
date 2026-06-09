# SmartFood PDV

MVP de PDV para restaurantes com salao, pedidos, cozinha/KDS, delivery, mock iFood, motoboys, pagamentos, estoque, equipe e assistente operacional.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Banco real: PostgreSQL + Prisma
- Auth: JWT
- Demo local: API mockada no frontend com persistencia em `localStorage`

## Rodar rapido, sem Docker

O frontend funciona sozinho em modo demo local. Ele simula as rotas da API e persiste os dados no navegador.

```bash
cd frontend
npm install
npm run dev
```

Acesse:

```text
http://localhost:5173
```

Login demo:

```text
E-mail: admin@smartfood.local
Senha: 123456
```

## Usar backend real

Suba um PostgreSQL local, configure `DATABASE_URL` no backend e rode:

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Depois de alterar o schema, gere e aplique a estrutura do banco:

```bash
cd backend
npx prisma generate
npx prisma db push
```

Configure `IFOOD_ENCRYPTION_KEY` no `.env` do backend. Essa chave protege o Client Secret salvo pelo usuario.

Em outro terminal:

```bash
cd frontend
npm install
$env:VITE_API_MODE="real"
npm run dev
```

No Windows PowerShell, o exemplo acima define `VITE_API_MODE=real` apenas para a sessao atual.

## Rodar com Docker

Se o Docker estiver instalado:

```bash
docker compose up --build
```

Acesse:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:3333/health`

## Modulos implementados

- Login demo/JWT
- Dashboard operacional
- Mesas e status
- Produtos/cardapio com cadastro rapido e pausa de venda
- Pedidos e KDS em Kanban
- Simulacao de pedido iFood
- Motoboys, status operacional e comissoes
- Pagamentos por pedido
- Estoque com cadastro de insumos e movimentacao de entrada/saida
- Equipe e ponto simples
- Assistente operacional mockado
- Integracao iFood configuravel com credenciais criptografadas, teste de conexao e sincronizacao automatica

## Rotas principais

```text
POST /auth/login
GET /dashboard
GET /tables
GET /products
POST /products
PATCH /products/:id
GET /orders
POST /orders
PATCH /orders/:id/status
PATCH /orders/:id/courier
POST /orders/:id/payments
GET /couriers
POST /couriers
PATCH /couriers/:id
GET /ingredients
POST /ingredients
POST /ingredients/:id/movement
POST /ifood/simulate-order
POST /assistant/ask
```
