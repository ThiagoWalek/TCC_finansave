# Finansave - Sistema de Gerenciamento Financeiro Pessoal

Finansave é um sistema web completo para gerenciamento financeiro pessoal, desenvolvido como projeto de TCC. O sistema permite controlar contas, metas financeiras, orçamentos, transferências e parcelamentos.

## Tecnologias Utilizadas

- Node.js
- Express.js
- MySQL
- Sequelize ORM
- EJS (Template Engine)
- Express Session
- BCrypt
- Express Validator

## Pré-requisitos

- Node.js (versão 14 ou superior)
- MySQL (versão 5.7 ou superior)

## Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd finansave
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo .env:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
# Configurações do Servidor
PORT=3000

# Configurações do Banco de Dados
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_NAME=finansave

# Chave secreta para sessão
SESSION_SECRET=sua_chave_secreta_aqui
```

4. Configure o banco de dados:
- Crie um banco de dados MySQL chamado `finansave`
- Execute o script SQL fornecido para criar as tabelas necessárias

## Estrutura do Projeto

```
/finansave
  /controllers     # Controladores da aplicação
  /models          # Modelos do Sequelize
  /routes          # Rotas da aplicação
  /views           # Templates EJS
    /partials     # Componentes reutilizáveis
    /usuarios
    /contas
    /metas
    /orcamentos
    /transferencias
    /parcelamentos
  /public          # Arquivos estáticos
    /css
    /js
  /config          # Configurações
  /middleware      # Middlewares
  app.js           # Arquivo principal
  package.json
  .env
  README.md
```

## Funcionalidades

- Sistema completo de autenticação (registro, login, logout)
- Gerenciamento de contas bancárias
- Controle de metas financeiras
- Gestão de orçamentos mensais
- Registro de transferências entre contas
- Controle de parcelamentos
- Interface responsiva e amigável
- Validações de dados
- Proteção de rotas
- Mensagens de feedback

## Executando o Projeto

1. Desenvolvimento:
```bash
npm run dev
```

2. Produção:
```bash
npm start
```

O sistema estará disponível em `http://localhost:3000`

## Segurança

- Senhas criptografadas com BCrypt
- Proteção contra CSRF
- Validação de dados com Express Validator
- Sessões seguras
- Proteção de rotas por autenticação

## Contribuição

Este é um projeto acadêmico, mas sugestões e melhorias são bem-vindas. Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.