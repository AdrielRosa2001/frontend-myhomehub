# Product Requirement Document (PRD) - Ajustes e Novas Implementações MyFinance

Este documento define os requisitos de produto, especificações funcionais e decisões de design para as novas implementações e melhorias no front-end do MyFinance.

---

## 1. Visão Geral do Produto
O MyFinance é um dashboard financeiro pessoal simplificado. Atualmente, ele oferece funcionalidades básicas de CRUD de transações, resumo financeiro (receitas, despesas, saldo) e um gráfico de fluxo diário. As novas funcionalidades visam melhorar a experiência de análise, busca, organização e manipulação em lote de transações.

---

## 2. Escopo das Novas Funcionalidades (Front-End)

### 2.1. Filtro por Mês Específico
* **Objetivo**: Facilitar a seleção rápida de períodos mensais sem a necessidade de digitar datas de início e fim manualmente.
* **Comportamento**:
  * No popover de Filtros, será adicionada uma nova opção para seleção de **Mês** e **Ano**.
  * Ao selecionar um mês (ex: Junho) e um ano (ex: 2026), o front-end calculará automaticamente a data de início (ex: `2026-06-01`) e fim (ex: `2026-06-30`) correspondentes.
  * Esses valores calculados atualizarão os estados de `filterStartDate` e `filterEndDate` e farão a busca no banco de dados automaticamente.
  * O usuário ainda poderá selecionar "Personalizado" para inserir datas livremente.

### 2.2. Gráfico "Relatório Anual" (Substituição do "Fluxo Diário")
* **Objetivo**: Fornecer uma visão macro anual da saúde financeira, agrupando receitas e despesas mês a mês em vez de dia a dia.
* **Comportamento**:
  * O gráfico será renomeado para **"Relatório Anual"**.
  * Ele exibirá 12 colunas ou pontos (de Janeiro a Dezembro) referentes ao ano selecionado nos filtros.
  * O front-end buscará os dados do ano inteiro (ex: de `YYYY-01-01` a `YYYY-12-31`) correspondente ao ano do filtro ativo.
  * Os dados diários retornados do servidor serão agregados em 12 categorias mensais (`Jan`, `Fev`, `Mar`, etc.) para renderização suave e precisa.

### 2.3. Ações em Massa (Bulk Actions)
* **Objetivo**: Permitir que o usuário edite, exclua, duplique ou exporte várias transações de uma só vez, economizando tempo.
* **Comportamento**:
  * Cada linha da tabela de transações terá uma caixa de seleção (Checkbox).
  * O cabeçalho da tabela terá um Checkbox mestre para "Selecionar Tudo".
  * Quando uma ou mais transações forem selecionadas, uma barra de **Ações em Massa** será exibida de forma destacada sobre a tabela.
  * **Ações Disponíveis**:
    1. **Editar**: Abre um modal específico para edição em lote onde é possível alterar apenas:
       * *Tipo* (Receita / Despesa)
       * *Data* (YYYY-MM-DD)
       * *Categoria* (Texto)
       * *Transação Efetivada?* (Switch de status pago/pendente)
    2. **Excluir**: Exibe um modal de confirmação. Se confirmado, todas as transações selecionadas são removidas.
    3. **Duplicar**: Abre um modal onde o usuário escolhe os novos dados de replicação (*Tipo*, *Data*, *Categoria* e *Status*) que serão aplicados a todas as duplicatas. O valor e a descrição originais de cada transação selecionada serão preservados na cópia.
    4. **Exportar**: Gera e faz o download instantâneo de um arquivo CSV formatado com as transações selecionadas.

### 2.4. Ordenação nas Colunas da Tabela
* **Objetivo**: Facilitar a organização visual e análise rápida das transações na tabela.
* **Comportamento**:
  * Ao clicar no cabeçalho das colunas (*Data*, *Descrição*, *Categoria*, *Status*, *Valor*), a tabela será ordenada por aquela coluna de forma crescente ou decrescente.
  * Um ícone discreto (como setas para cima/baixo) indicará visualmente qual coluna está ordenando e qual o sentido atual da ordenação.

### 2.5. Campo de Busca (Search Input)
* **Objetivo**: Localizar transações específicas de forma instantânea.
* **Comportamento**:
  * Um campo de texto será adicionado acima da tabela de transações.
  * A filtragem ocorrerá em tempo real enquanto o usuário digita, buscando termos nas colunas de **Descrição** e **Categoria**.

---

## 3. Tecnologias & UI Framework
* **Next.js 16** & **React 19**
* **Tailwind CSS v4** para estilos
* **Shadcn UI** para os componentes interativos (`Dialog`, `Switch`, `Select`, `Popover`, etc.)
* **Lucide React** para iconografia consistente
* **Date-fns** para tratamento de datas

---

## 4. Plano de Validação & Testes
1. **Filtros**: Selecionar um mês e ano e verificar se os registros e resumos se ajustam corretamente para o intervalo do mês escolhido.
2. **Gráfico**: Validar se os valores são consolidados mês a mês e se mostram o ano completo de forma correta.
3. **Seleção e Ações em Massa**:
   * Marcar múltiplos itens e certificar-se de que a barra de ações aparece.
   * Executar edição, exclusão e duplicação em lote e verificar a persistência.
   * Exportar CSV e abri-lo para validar as colunas e dados.
4. **Busca e Ordenação**:
   * Digitar um termo e garantir que a tabela filtre apenas as linhas correspondentes.
   * Clicar nos cabeçalhos e verificar a alteração da ordem dos dados.
