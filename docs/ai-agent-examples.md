# Exemplos Práticos - Agente IA com Acesso aos Dados

## Como o Agente IA Acessa Seus Dados

### 📊 Fluxo de Dados Automático:

1. **Você faz login** com seu CPF
2. **Sistema carrega** automaticamente:
   - Dados pessoais da planilha "dados pessoais" 
   - Informações de matrícula da planilha "matriculas"
   - Pedidos de livros da planilha "pedidos"
   - Status de pagamentos da planilha "pagamentos"

3. **IA recebe contexto** completo:
```javascript
// Exemplo dos dados que a IA recebe:
{
  nome: "João Silva",
  cpf: "123.456.789-00", 
  email: "joao@email.com",
  telefone: "(63) 99999-9999",
  ciclo: "2º Ciclo - Médio",
  nucleo: "Palmas Centro",
  status: "Matriculado",
  ultimoPedido: "Teologia Sistemática - R$ 45,00",
  statusPagamento: "Pendente"
}
```

### 💬 Exemplos de Conversas Personalizadas:

#### Exemplo 1 - Consulta de Livros:
**Você:** "Quais livros posso pedir?"

**IA:** "Oi João! 😊 Vejo que você está no 2º Ciclo (Médio) no núcleo Palmas Centro. Os livros disponíveis para o seu ciclo são:

📚 **Livros do 2º Ciclo:**
- Teologia Sistemática - R$ 45,00
- Hermenêutica Bíblica - R$ 45,00  
- História da Igreja - R$ 45,00
- Homilética - R$ 45,00

Vejo também que você tem um pedido pendente de 'Teologia Sistemática' no valor de R$ 45,00. Gostaria que eu te ajude com o pagamento? 💰"

#### Exemplo 2 - Status de Pagamento:
**Você:** "Como está meu pagamento?"

**IA:** "Olá João! 💙 Consultando seus dados aqui no sistema:

📊 **Status dos seus Pagamentos:**
✅ **Pago**: Introdução Bíblica - R$ 45,00 (pago em 15/08/2024)
⏰ **Pendente**: Teologia Sistemática - R$ 45,00 (pedido em 02/09/2024)

Posso gerar um código PIX agora mesmo para o pagamento pendente. É só me pedir! 🙏"

#### Exemplo 3 - Informações Acadêmicas:
**Você:** "Quais disciplinas já cursei?"

**IA:** "Que bênção acompanhar sua jornada, João! 🎓

📖 **Seu Progresso Acadêmico:**
- **Ciclo Atual**: 2º Ciclo - Formação Média
- **Núcleo**: Palmas Centro  
- **Status**: Matriculado e em dia
- **Disciplinas Concluídas**: 8 de 16 do seu ciclo
- **Próxima Disciplina**: Pneumatologia (início em Janeiro/2025)

Você está indo muito bem! Continue firme nesta caminhada de fé e conhecimento. 💪✨"

### 🔍 Como a IA Consulta os Dados:

#### 1. Dados Pessoais (Planilha "dados pessoais"):
```
- Nome completo
- CPF, RG, telefone, email
- Endereço completo
- Dados familiares e profissionais
- Informações da igreja
```

#### 2. Dados Acadêmicos (Planilha "matriculas"):
```
- Ciclo atual
- Núcleo e subnúcleo
- Data de matrícula
- Status acadêmico
- Observações especiais
```

#### 3. Pedidos de Livros (Planilha "pedidos"):
```
- Livros solicitados
- Datas dos pedidos
- Valores
- Status (pendente/pago/entregue)
- Códigos de rastreamento
```

#### 4. Pagamentos (Planilha "pagamentos"):
```
- Histórico de pagamentos
- Métodos utilizados (PIX, cartão)
- Datas e valores
- Comprovantes
- Status atual
```

### 🎯 Vantagens do Sistema Integrado:

✅ **Atendimento 100% Personalizado**
✅ **Acesso Instantâneo aos seus Dados**
✅ **Respostas Específicas e Precisas**
✅ **Histórico Completo de Interações**
✅ **Sugestões Baseadas no seu Perfil**
✅ **Orientações Acadêmicas Personalizadas**

### 📞 Quando Procurar a Secretaria:

A IA te orienta a contatar a secretaria para:
- Alterações cadastrais importantes
- Problemas complexos de pagamento
- Questões disciplinares
- Certificados e documentos oficiais
- Transferências ou trancamentos

**Horário da Secretaria**: Segunda a Sexta, 8h às 17h
**WhatsApp**: (63) 98511-2006