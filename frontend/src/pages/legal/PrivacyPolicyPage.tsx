import { Link } from 'react-router-dom'
import LegalLayout, { Section } from './LegalLayout'
import { LEGAL } from './legalVersion'

// RASCUNHO escrito a partir do que o sistema realmente coleta e faz. Revisar com um advogado
// antes de publicar, e preencher os dados do responsável em legalVersion.ts.

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Política de Privacidade">
      <p>
        Esta Política explica quais dados pessoais o <strong>Toc Toc Who?</strong> coleta, para que usa, com quem
        compartilha e como você exerce seus direitos, conforme a Lei Geral de Proteção de Dados (Lei nº
        13.709/2018, a “LGPD”). Ao criar uma conta, você declara que leu e entendeu esta Política.
      </p>

      <Section title="1. Quem é o responsável pelos seus dados">
        <p>
          O controlador dos dados é <strong>{LEGAL.controllerName}</strong>, {LEGAL.controllerDocument}, com
          endereço em {LEGAL.controllerAddress}.
        </p>
        <p>
          Para qualquer assunto sobre seus dados, fale com o nosso encarregado (DPO) pelo e-mail{' '}
          <strong>{LEGAL.privacyEmail}</strong>.
        </p>
      </Section>

      <Section title="2. Quais dados coletamos">
        <h3>Dados que você informa</h3>
        <ul>
          <li>
            <strong>Cadastro:</strong> nome, e-mail, senha, data de nascimento e CPF.
          </li>
          <li>
            <strong>Perfil de convivência:</strong> sexo, se fuma, se bebe, alimentação, relação com animais de
            estimação, alergias, se precisa de vaga de garagem, ocupação (curso ou profissão), texto “sobre mim” e
            foto.
          </li>
          <li>
            <strong>Anúncios:</strong> título, descrição, valor, bairro, endereço e localização no mapa,
            características do imóvel (dormitórios, garagem, condomínio etc.), quem pode ocupar a vaga e fotos.
          </li>
          <li>
            <strong>Uso da plataforma:</strong> mensagens das conversas, interesses em imóveis, convívios e
            avaliações entre pessoas que moraram juntas, bloqueios e denúncias.
          </li>
        </ul>
        <h3>Dados gerados pelo uso</h3>
        <ul>
          <li>
            <strong>Pagamentos:</strong> tipo de compra (anúncio extra ou destaque), valor, situação e a referência
            da transação no meio de pagamento. <strong>Não armazenamos</strong> dados de cartão nem da sua conta
            bancária: isso fica com o provedor de pagamento.
          </li>
          <li>
            <strong>Dados técnicos:</strong> endereço IP, usado para limitar tentativas de login e cadastro (proteção
            contra ataques), e registros de acesso à aplicação.
          </li>
          <li>
            <strong>No seu navegador:</strong> guardamos o seu token de login e a preferência de tema (claro/escuro)
            no armazenamento local do navegador. Não usamos cookies de publicidade nem ferramentas de rastreamento.
          </li>
        </ul>
        <h3>Dado sensível: alergias</h3>
        <p>
          Informações sobre alergias são <strong>dados de saúde</strong>, considerados sensíveis pela LGPD. Informar é{' '}
          <strong>opcional</strong>: existe a opção “Prefiro não informar”. Se você informar, a informação fica{' '}
          <strong>só no seu perfil</strong>, não aparece para outras pessoas e não é usada em nenhum cálculo. Ela só é
          tratada com o seu consentimento, que você pode revogar a qualquer momento escolhendo “Prefiro não informar”,
          apagando a informação ou excluindo a conta.
        </p>
      </Section>

      <Section title="3. Para que usamos e com qual base legal">
        <ul>
          <li>
            <strong>Criar e manter sua conta, fazer login e prestar o serviço</strong> (conversas, anúncios,
            notificações, e-mails de redefinição de senha): execução de contrato (art. 7º, V).
          </li>
          <li>
            <strong>CPF e data de nascimento:</strong> impedir contas duplicadas ou falsas e garantir que só maiores de
            18 anos usem a plataforma: execução de contrato e legítimo interesse na prevenção a fraudes (art. 7º, V e
            IX).
          </li>
          <li>
            <strong>Perfil de convivência:</strong> calcular a compatibilidade entre pessoas e mostrar vagas destinadas a
            um sexo específico: execução de contrato (art. 7º, V). Alergias (opcionais, só você vê): consentimento (art.
            11, I).
          </li>
          <li>
            <strong>Segurança e moderação</strong> (denúncias, bloqueios, limite de tentativas, bloqueio de contas que
            violam as regras): legítimo interesse e proteção dos usuários (art. 7º, IX).
          </li>
          <li>
            <strong>Pagamentos e registros fiscais:</strong> execução de contrato e cumprimento de obrigação legal (art.
            7º, II e V).
          </li>
          <li>
            <strong>Registros de acesso:</strong> cumprimento de obrigação legal do Marco Civil da Internet (Lei nº
            12.965/2014, art. 15).
          </li>
        </ul>
        <p>Não usamos seus dados para publicidade, não vendemos dados e não tomamos decisões automatizadas sobre você.</p>
      </Section>

      <Section title="4. Quem vê seus dados">
        <h3>Outros usuários</h3>
        <ul>
          <li>
            <strong>Seu perfil público</strong> mostra: nome, foto, ocupação, texto “sobre mim”, hábitos de convivência
            e as avaliações recebidas. <strong>Não mostra</strong> seu e-mail, CPF, data de nascimento nem alergias.
          </li>
          <li>
            <strong>Seus anúncios</strong> mostram: título, descrição, valor, bairro, endereço, localização no mapa,
            características e fotos.
          </li>
          <li>As mensagens de uma conversa são vistas só por quem participa dela.</li>
          <li>Quem você denuncia nunca fica sabendo quem fez a denúncia.</li>
        </ul>
        <h3>Prestadores de serviço</h3>
        <p>Compartilhamos dados apenas com quem precisamos para o site funcionar, e só o necessário:</p>
        <ul>
          <li>hospedagem dos servidores e do banco de dados;</li>
          <li>envio de e-mails (redefinição de senha e avisos da conta);</li>
          <li>meio de pagamento, para processar compras;</li>
          <li>
            serviço de mapas e busca de endereços (MapTiler, na Suíça, com dados do OpenStreetMap), que recebe o
            endereço digitado ao criar um anúncio e o seu IP ao carregar os mapas (transferência internacional, art.
            33; a Suíça é reconhecida pela União Europeia como país com proteção de dados adequada).
          </li>
        </ul>
        <h3>Autoridades</h3>
        <p>Quando houver ordem judicial ou obrigação legal.</p>
      </Section>

      <Section title="5. Por quanto tempo guardamos">
        <ul>
          <li>Enquanto sua conta existir, guardamos os dados para prestar o serviço.</li>
          <li>
            <strong>Ao excluir a conta</strong>, os dados pessoais são apagados na hora (veja a seção 7).
          </li>
          <li>
            Ficam guardados, sem identificar você, somente: <strong>registros de pagamento</strong>, pelo prazo exigido
            pela legislação fiscal (5 anos), e <strong>denúncias</strong> feitas ou recebidas, por{' '}
            {LEGAL.reportRetention}, para a segurança dos outros usuários e para eventual defesa em processo (art. 16).
          </li>
          <li>Registros de acesso à aplicação: 6 meses, como exige o Marco Civil da Internet.</li>
        </ul>
      </Section>

      <Section title="6. Como protegemos">
        <ul>
          <li>Senhas guardadas com criptografia de mão única (ninguém, nem nós, consegue ver sua senha).</li>
          <li>Conexão protegida (HTTPS) e banco de dados sem acesso direto pela internet.</li>
          <li>O banco de dados só entrega a cada pessoa as suas próprias mensagens, notificações e pagamentos.</li>
          <li>Limite de tentativas de login e aviso quando alguém pede a troca da sua senha.</li>
          <li>Acesso aos dados restrito a quem administra a plataforma, e toda ação de moderação fica registrada.</li>
        </ul>
        <p>
          Nenhum sistema é 100% seguro. Se acontecer um incidente que possa trazer risco a você, avisaremos você e a
          Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </Section>

      <Section title="7. Seus direitos">
        <p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
        <ul>
          <li>confirmar se tratamos seus dados e ter acesso a eles;</li>
          <li>
            corrigir dados incompletos ou errados (a maior parte direto em <Link to="/perfil">Meu perfil</Link>);
          </li>
          <li>pedir a anonimização, o bloqueio ou a eliminação de dados desnecessários;</li>
          <li>pedir a portabilidade dos dados;</li>
          <li>saber com quem compartilhamos seus dados;</li>
          <li>revogar o consentimento (por exemplo, escolhendo “Prefiro não informar” nas alergias);</li>
          <li>
            <strong>excluir sua conta</strong>, pelo botão “Excluir minha conta” em <Link to="/perfil">Meu perfil</Link>.
            Isso apaga na hora seu perfil, foto, anúncios, mensagens enviadas, notificações e os dados do cadastro.
          </li>
        </ul>
        <p>
          Para os demais pedidos, escreva para <strong>{LEGAL.privacyEmail}</strong>. Respondemos em até 15 dias. Você
          também pode reclamar na ANPD (www.gov.br/anpd).
        </p>
      </Section>

      <Section title="8. Menores de idade">
        <p>O Toc Toc Who? é só para maiores de 18 anos. Não coletamos intencionalmente dados de menores.</p>
      </Section>

      <Section title="9. Mudanças nesta Política">
        <p>
          Se mudarmos esta Política de forma relevante, avisaremos no site e pediremos que você aceite a nova versão
          antes de continuar usando. A data da versão fica no topo desta página.
        </p>
      </Section>

      <p className="mt-4 text-small text-ink-3">
        Veja também os <Link to="/termos">Termos de Uso</Link>.
      </p>
    </LegalLayout>
  )
}
