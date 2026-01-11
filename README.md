# SPHAUS - SALAS

Sistema de agendamento de salas desenvolvido com React Native e NestJS.

## 📋 Estrutura do Projeto

```
sphaus/
├── backend/          # API NestJS com Prisma
└── mobile/           # App React Native (Expo)
```

## 🚀 Backend

### Pré-requisitos
- Node.js 18+
- PostgreSQL (ou SQLite para desenvolvimento)

### Instalação

```bash
cd backend
npm install
```

### Configuração

1. Crie um arquivo `.env` na pasta `backend/`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sphaus?schema=public"
JWT_SECRET="sua-chave-secreta-super-segura-aqui-mude-em-producao"
```

Para desenvolvimento rápido, você pode usar SQLite:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua-chave-secreta-super-segura-aqui-mude-em-producao"
```

2. Execute as migrações do Prisma:

```bash
npm run prisma:generate
npm run prisma:migrate
```

3. Inicie o servidor:

```bash
npm run start:dev
```

O backend estará rodando em `http://localhost:3000`

### Criar Usuário Admin

Para criar um usuário admin, você pode usar o Prisma Studio:

```bash
npm run prisma:studio
```

Ou executar diretamente no banco de dados, criando um usuário com `role: 'ADMIN'` e `approved: true`.

## 📱 Mobile

### Pré-requisitos
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)

### Instalação

```bash
cd mobile
npm install
```

### Configuração

1. **IMPORTANTE**: Edite o arquivo `mobile/src/services/api.ts` e altere a URL da API para o IP da sua máquina no desenvolvimento:

```typescript
// Substitua localhost pelo IP da sua máquina na rede local
const API_URL = 'http://192.168.1.100:3000'; // Exemplo
```

Para descobrir seu IP:
- **Windows**: `ipconfig` no terminal
- **Mac/Linux**: `ifconfig` ou `ip addr`

### Execução

```bash
npm start
```

Depois escaneie o QR Code com o app Expo Go no seu celular.

## ✨ Funcionalidades

### 👤 Usuário Cliente
- ✅ Auto-cadastro (aguardando aprovação do admin)
- ✅ Login (após aprovação)
- ✅ Visualizar salas disponíveis
- ✅ Filtrar salas por período
- ✅ Agendar salas (uma por vez)
- ✅ Visualizar suas reservas
- ✅ Cancelar reservas

### 👨‍💼 Usuário Admin
- ✅ Login
- ✅ Aprovar cadastros de usuários
- ✅ Cadastrar, editar e excluir salas
- ✅ Visualizar todas as reservas
- ✅ Aprovar reservas pendentes

## 🛠️ Tecnologias Utilizadas

### Backend
- NestJS
- Prisma ORM
- PostgreSQL / SQLite
- JWT Authentication
- TypeScript

### Mobile
- React Native
- Expo
- React Navigation
- TypeScript
- Axios

## 📝 Notas Importantes

1. **Banco de Dados**: O projeto usa PostgreSQL por padrão, mas pode ser facilmente configurado para SQLite para desenvolvimento.

2. **API URL**: Lembre-se de atualizar a URL da API no arquivo `mobile/src/services/api.ts` com o IP da sua máquina.

3. **Usuário Admin**: O primeiro usuário admin precisa ser criado manualmente no banco de dados com `role: 'ADMIN'` e `approved: true`.

4. **Reservas**: Um cliente só pode ter uma reserva ativa por vez. Para fazer uma nova reserva, é necessário cancelar a reserva atual primeiro.

## 🔒 Segurança

- Senhas são criptografadas usando bcrypt
- Autenticação JWT com expiração de 7 dias
- Validação de dados no backend e frontend
- Proteção de rotas por roles (ADMIN/CLIENT)

## 📄 Licença

MIT
