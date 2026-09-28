# LGPD: termos, privacidade e exclusão de conta

## 1. Antes de publicar o site

Os textos são um **rascunho técnico**: descrevem com precisão o que o sistema coleta e faz, mas
não substituem um advogado.

1. **Preencha os dados do responsável** em [frontend/src/pages/legal/legalVersion.ts](../frontend/src/pages/legal/legalVersion.ts):
   nome ou razão social, CPF/CNPJ, endereço, e-mail de privacidade (encarregado/DPO), e-mail de
   suporte e cidade do foro. Enquanto isso, as páginas mostram `[ENTRE COLCHETES]`.
2. **Peça para um advogado revisar** a [Política de Privacidade](../frontend/src/pages/legal/PrivacyPolicyPage.tsx)
   e os [Termos de Uso](../frontend/src/pages/legal/TermsPage.tsx).
3. Resolva as pendências da seção 7.

## 2. Onde fica cada coisa

| O quê | Onde |
|---|---|
| Página da Política de Privacidade | `/privacidade` (pública) |
| Página dos Termos de Uso | `/termos` (pública) |
| Links no rodapé | página inicial, login, cadastro, perfil |
| Aceite no cadastro | caixa obrigatória; o backend recusa cadastro sem `acceptTerms: true` |
| Aceite de quem já tinha conta | aviso "Termos e privacidade" que bloqueia o site até aceitar (ou sair) |
| Excluir conta | **Meu perfil → Excluir minha conta** (pede a senha e a palavra EXCLUIR) |

## 3. Versão dos textos e novo aceite

A versão em vigor é uma data, que precisa ser **igual** em dois lugares:
- `backend/src/main/java/com/rachaai/user/LegalTerms.java` (`CURRENT_VERSION`)
- `frontend/src/pages/legal/legalVersion.ts` (`LEGAL_VERSION` e `LEGAL_VERSION_LABEL`)

Cada conta guarda **quando** e **qual versão** aceitou (`usuarios.termos_aceitos_em` e
`usuarios.versao_termos`): é a prova do consentimento. Ao mudar o texto de forma relevante, troque
a data nos dois lugares: todo mundo que aceitou a versão antiga vê o aviso de novo.

## 4. O que "Excluir minha conta" faz

Não apaga a linha da conta: **anonimiza**. Assim os registros que a lei manda guardar continuam
válidos, mas sem identificar ninguém (dado anonimizado não é mais dado pessoal, art. 12).

| Apagado na hora | Mantido sem identificação |
|---|---|
| nome, e-mail, CPF, nascimento, bio, ocupação, senha | a linha vira "Usuário excluído" |
| perfil de convivência (sexo, hábitos, alergias, garagem) | pagamentos (obrigação fiscal) |
| foto de perfil | denúncias feitas e recebidas (segurança e defesa) |
| anúncios: saem do ar, perdem fotos, endereço, mapa e descrição | convívios e avaliações que a pessoa **fez** |
| texto das mensagens enviadas (vira "[mensagem apagada…]") | as conversas continuam para a outra pessoa |
| notificações, interesses, bloqueios, links de redefinir senha | |
| avaliações que a pessoa **recebeu** | |

Depois disso, todos os logins caem, não dá para entrar de novo, e o perfil público responde 404.
O mesmo CPF e e-mail podem criar uma conta nova. Contas de admin não podem ser excluídas por aqui.

Código: `user/AccountDeletionService.java` e `User.anonymize()`.

## 5. Alergias (dado de saúde)

- Existe a opção **"Prefiro não informar"**, que desmarca as outras (e vice-versa). Assim, responder
  não obriga ninguém a revelar dado de saúde (consentimento livre).
- As alergias **só aparecem para a própria pessoa**: o perfil de outra pessoa (perfil público,
  busca, conversas, interessados) vem sem elas, também pela API.

## 6. Registros de acesso (Marco Civil, art. 15)

A lei exige guardar, por **6 meses**, data e hora de uso a partir de um IP, e entregar só com
ordem judicial. Tabela `registros_acesso` (migration V31):

| Coluna | O quê |
|---|---|
| `usuario_id` | a conta (vazio quando não há login, ex.: login com senha errada) |
| `ip`, `porta` | IP e porta de origem. A porta é necessária porque operadoras compartilham um IP entre vários clientes (CGNAT) |
| `evento` | `LOGIN`, `LOGIN_FALHOU`, `CADASTRO`, `LOGOUT`, `SENHA_REDEFINIDA`, `CONTA_EXCLUIDA` ou `ACESSO` |
| `metodo`, `rota`, `status`, `criado_em` | a chamada e quando |

- **Agrupamento:** `ACESSO` (uso comum) grava no máximo 1 linha a cada 5 min por conta + IP; os
  eventos de conta sempre são gravados.
- **Prazo:** todo dia às 3h apaga o que tem mais de 183 dias (`ACCESS_LOG_RETENTION_DAYS`).
- **Quem lê:** ninguém pelo site (política RLS devolve zero linhas para qualquer usuário). Só pelo
  banco, para atender ordem judicial:
  ```sql
  SELECT r.criado_em, r.ip, r.porta, r.evento, r.rota
  FROM registros_acesso r WHERE r.usuario_id = :id AND r.criado_em BETWEEN :inicio AND :fim
  ORDER BY r.criado_em;
  ```
- **IP e porta reais:** vêm dos cabeçalhos `X-Real-IP` e `X-Real-Port` que o Nginx do frontend
  preenche. Com um proxy na frente em produção (Caddy/Cloudflare), o Nginx precisa ler o IP e a
  porta originais do proxy, senão tudo aparece com o endereço dele (ver 08-SEGURANCA.md).
- Chamadas recusadas pela segurança antes de chegar à aplicação (ex.: token inválido) não geram linha.

## 7. Pendências de LGPD que ainda existem

| Pendência | Por quê | Sugestão |
|---|---|---|
| **Alergia guardada sem uso** | a alergia não entra em nenhum cálculo nem aparece para ninguém; pela LGPD (art. 6º, III, necessidade) dado sensível sem finalidade não deveria ser coletado | decidir: **usar** (ex.: avisar "alergia a pelo × imóvel com pets") ou **tirar o campo** |
| **Portabilidade** ("baixar meus dados") | direito do art. 18, V | botão que gera um arquivo com os dados da conta |
| **Prazo das denúncias** | a Política diz 5 anos; não há rotina que apague depois | tarefa agendada que apaga denúncias fechadas com mais de 5 anos |
| **Mapas fora do Brasil** | o MapTiler (Suíça) recebe o endereço digitado e o IP | já está na Política; ao trocar de provedor, atualizar o texto |
| **Encarregado (DPO)** | é obrigatório indicar alguém e um canal | preencher o e-mail em `legalVersion.ts` e responder em até 15 dias |
