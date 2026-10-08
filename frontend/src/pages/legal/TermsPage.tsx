import { Link } from 'react-router-dom'
import LegalLayout, { Section } from './LegalLayout'
import { LEGAL } from './legalVersion'

// RASCUNHO escrito a partir de como o sistema funciona hoje. Revisar com um advogado antes de
// publicar, e preencher os dados do responsável em legalVersion.ts.

export default function TermsPage() {
  return (
    <LegalLayout title="Termos de Uso">
      <p>
        Estes Termos regem o uso do <strong>Toc Toc Who?</strong>, oferecido por <strong>{LEGAL.controllerName}</strong>,{' '}
        {LEGAL.controllerDocument}. Ao criar uma conta você concorda com eles e com a{' '}
        <Link to="/privacidade">Política de Privacidade</Link>. Se não concordar, não use a plataforma.
      </p>

      <Section title="1. O que é o Toc Toc Who?">
        <p>
          O Toc Toc Who? é uma plataforma que <strong>conecta</strong> pessoas que procuram lugar para morar com quem tem uma
          vaga para dividir ou um imóvel para alugar, principalmente estudantes de Maringá.
        </p>
        <p>
          O Toc Toc Who? <strong>não é imobiliária</strong>, não é dono dos imóveis anunciados, não participa das negociações,
          não recebe aluguel nem caução, e não é parte de nenhum contrato entre os usuários. Também não verifica
          antecedentes, identidade nem a situação dos imóveis.
        </p>
      </Section>

      <Section title="2. Sua conta">
        <ul>
          <li>Você precisa ter <strong>18 anos ou mais</strong>.</li>
          <li>Os dados do cadastro (nome, e-mail, CPF, nascimento) precisam ser verdadeiros e seus. Uma conta por CPF.</li>
          <li>A senha é pessoal. Tudo que for feito com a sua conta é responsabilidade sua; avise-nos se desconfiar de acesso indevido.</li>
          <li>O sexo informado no perfil não pode ser alterado depois de salvo, porque define quais vagas você vê.</li>
          <li>
            Você pode excluir sua conta quando quiser, em <Link to="/perfil">Meu perfil</Link>.
          </li>
        </ul>
      </Section>

      <Section title="3. O que não é permitido">
        <p>É proibido usar o Toc Toc Who? para:</p>
        <ul>
          <li>publicar anúncios falsos, de imóveis que você não tem direito de anunciar, ou com fotos e informações enganosas;</li>
          <li>aplicar golpes, pedir pagamentos adiantados sem mostrar o imóvel, ou pedir dados bancários e senhas;</li>
          <li>assediar, ameaçar, ofender ou discriminar pessoas por raça, cor, etnia, religião, origem, orientação sexual, identidade de gênero, deficiência ou qualquer outra característica;</li>
          <li>enviar spam, propaganda ou conteúdo sexual, violento ou ilegal;</li>
          <li>criar contas falsas, usar dados de outra pessoa ou tentar acessar contas e dados que não são seus;</li>
          <li>copiar em massa os dados da plataforma ou tentar atacar, sobrecarregar ou burlar a segurança do site.</li>
        </ul>
        <p>
          Vagas “só para mulheres” ou “só para homens” são permitidas como preferência de convivência para dividir
          moradia, e a plataforma só mostra essas vagas para quem se encaixa.
        </p>
      </Section>

      <Section title="4. Anúncios">
        <ul>
          <li>Quem anuncia é o único responsável pela veracidade do anúncio e por ter o direito de anunciar o imóvel.</li>
          <li>Cada conta pode ter até <strong>3 anúncios ativos grátis</strong>. A partir do 4º, é preciso comprar um anúncio extra.</li>
          <li>O <strong>anúncio extra</strong> fica ativo por 30 dias e não renova sozinho. O <strong>destaque</strong> coloca o anúncio no topo da busca por 30 dias.</li>
          <li>Preços e prazos em vigor aparecem na tela antes da compra.</li>
          <li>O anúncio aparece para outros usuários com o endereço e a localização no mapa que você informar.</li>
        </ul>
      </Section>

      <Section title="5. Pagamentos">
        <ul>
          <li>Pagamentos são processados por um provedor de pagamento parceiro; o Toc Toc Who? não guarda dados de cartão ou conta bancária.</li>
          <li>
            Pelo Código de Defesa do Consumidor (art. 49), você pode desistir de uma compra em até <strong>7 dias</strong>{' '}
            e receber o valor de volta. Peça pelo e-mail {LEGAL.supportEmail}.
          </li>
          <li>Anúncios removidos pela moderação por violar estes Termos não dão direito a reembolso.</li>
        </ul>
      </Section>

      <Section title="6. Segurança nos encontros e negócios">
        <p>
          Quem vai morar com você é alguém que você ainda não conhece. Converse bastante antes de fechar qualquer acordo,
          marque o primeiro encontro em local público, visite o imóvel antes de pagar qualquer valor, desconfie de
          urgência e de pagamentos fora da plataforma, e formalize os combinados por escrito.
        </p>
        <p>
          Os acordos de aluguel e de convivência são feitos diretamente entre os usuários, que respondem por eles. O
          Toc Toc Who? não se responsabiliza por danos, prejuízos ou conflitos decorrentes desses acordos, dos encontros ou da
          convivência.
        </p>
      </Section>

      <Section title="7. Moderação">
        <ul>
          <li>Você pode denunciar e bloquear outras pessoas. A pessoa denunciada não fica sabendo quem denunciou.</li>
          <li>
            Podemos <strong>tirar anúncios do ar</strong> e <strong>bloquear contas</strong> que violem estes Termos ou a
            lei, ou que coloquem outros usuários em risco. Conta bloqueada não consegue entrar e os anúncios dela saem da
            busca.
          </li>
          <li>Se achar que foi bloqueado por engano, escreva para {LEGAL.supportEmail}.</li>
        </ul>
      </Section>

      <Section title="8. Conteúdo que você publica">
        <p>
          Fotos, textos e anúncios continuam sendo seus. Ao publicar, você autoriza o Toc Toc Who? a exibi-los na plataforma
          enquanto estiverem publicados, e declara que tem direito de usá-los (por exemplo, as fotos do imóvel).
        </p>
      </Section>

      <Section title="9. Disponibilidade e responsabilidade">
        <p>
          Trabalhamos para o site funcionar sempre, mas ele pode ficar fora do ar para manutenção ou por problemas
          técnicos. O Toc Toc Who? não garante que você vai encontrar uma vaga ou um inquilino, nem a veracidade das informações
          publicadas por outros usuários.
        </p>
      </Section>

      <Section title="10. Mudanças nestes Termos">
        <p>
          Se mudarmos estes Termos de forma relevante, avisaremos no site e pediremos que você aceite a nova versão antes
          de continuar usando.
        </p>
      </Section>

      <Section title="11. Lei e foro">
        <p>
          Estes Termos seguem a lei brasileira. Fica eleito o foro de {LEGAL.forumCity}, ressalvado o direito do consumidor
          de propor ação no foro do seu domicílio.
        </p>
      </Section>

      <Section title="12. Contato">
        <p>
          Dúvidas: {LEGAL.supportEmail}. Assuntos de dados pessoais: {LEGAL.privacyEmail}.
        </p>
      </Section>
    </LegalLayout>
  )
}
