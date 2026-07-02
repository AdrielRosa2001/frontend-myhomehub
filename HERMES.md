# 🏠 MyHomeHub — Frontend (Next.js + shadcn/ui)

## Workflow de Desenvolvimento

### 1. Desenvolver funcionalidades ou corrigir problemas
- Componentes shadcn/ui em `components/ui/`
- Páginas em `app/` (App Router do Next.js 16)
- Estilização: Tailwind CSS v4 + `tw-animate-css`
- API calls via `lib/api.ts` (axios com interceptors de autenticação)

### 2. Escrever testes
- Testes com Vitest/Jest (quando configurado)
- Testes de componentes para UI crítica
- Testes de integração para fluxos de usuário

### 3. Validar com linters e TypeScript
```bash
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript check
```

### 4. Validar com Docker (após testes OK)
```bash
docker compose up -d --build
```
- URL de teste: http://localhost:8080
- Conta de teste: `teste@teste.com` / `teste123`

### 5. Preparar para deploy
- Build de produção: `npm run build` (gera standalone)
- Validar Docker build: `docker compose build frontend`
- Verificar se `next.config.ts` tem `output: "standalone"`

### 6. Commit e Push (após aprovação)
```bash
git add -A
git commit -m "tipo: descrição clara do que foi feito"
git push origin <branch>
```

## Padrões do Projeto
- **Framework**: Next.js 16.2.6 + React 19
- **UI**: shadcn/ui + Tailwind CSS v4
- **Ícones**: lucide-react
- **Gráficos**: ApexCharts (react-apexcharts)
- **Tema**: Dark mode (padrão)
- **API**: Axios com baseURL `/api` + token JWT via interceptor
- **Notificações**: sonner (toasts)
