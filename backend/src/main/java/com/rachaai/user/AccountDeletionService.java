package com.rachaai.user;

import com.rachaai.common.ApiException;
import com.rachaai.listing.Listing;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * "Excluir minha conta" (LGPD, art. 18, VI: eliminação dos dados pessoais).
 *
 * APAGA: perfil de convivência (hábitos, sexo, alergias...), foto, notificações, interesses,
 * bloqueios, links de redefinição de senha, avaliações recebidas, fotos e dados dos anúncios
 * (endereço, mapa, descrição), o texto das mensagens enviadas, e da conta: nome, e-mail, CPF,
 * nascimento, bio e ocupação.
 *
 * MANTÉM, sem identificar a pessoa (a linha vira "Usuário excluído"): pagamentos (obrigação
 * fiscal) e denúncias feitas ou recebidas (segurança dos outros usuários e defesa em processo),
 * conforme o art. 16 da LGPD. Conversas continuam para a outra pessoa, com as mensagens da
 * conta excluída apagadas.
 */
@Service
public class AccountDeletionService {

    private static final Logger log = LoggerFactory.getLogger(AccountDeletionService.class);
    static final String DELETED_MESSAGE = "[mensagem apagada: a conta foi excluída]";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager em;

    public AccountDeletionService(UserRepository userRepository, PasswordEncoder passwordEncoder, EntityManager em) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.em = em;
    }

    @Transactional
    public void deleteAccount(Long userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Usuário não encontrado"));
        if (user.isDeleted()) {
            return;
        }
        if (password == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw ApiException.forbidden("Senha incorreta");
        }
        if (user.isAdmin()) {
            throw ApiException.forbidden("Contas de administrador não podem ser excluídas por aqui. Tire o e-mail de ADMIN_EMAILS e remova o admin no banco antes.");
        }

        // Coisas soltas ligadas à pessoa: apaga.
        bulk("delete from Notification n where n.user.id = :id", userId);
        bulk("delete from Interest i where i.user.id = :id", userId);
        bulk("delete from Block b where b.user.id = :id or b.blocked.id = :id", userId);
        bulk("delete from PasswordResetToken t where t.user.id = :id", userId);
        bulk("delete from UserPhoto p where p.userId = :id", userId);
        bulk("delete from Avaliacao a where a.avaliado.id = :id", userId);
        // Mensagens: a conversa segue existindo para a outra pessoa, sem o texto de quem saiu.
        em.createQuery("update Message m set m.content = :text where m.sender.id = :id")
                .setParameter("text", DELETED_MESSAGE)
                .setParameter("id", userId)
                .executeUpdate();

        // Anúncios: saem do ar e perdem tudo que identifica o imóvel/a pessoa.
        List<Listing> listings = em.createQuery("select l from Listing l where l.user.id = :id", Listing.class)
                .setParameter("id", userId)
                .getResultList();
        List<Long> listingIds = listings.stream().map(Listing::getId).toList();
        if (!listingIds.isEmpty()) {
            em.createQuery("delete from ListingPhoto p where p.listingId in :ids").setParameter("ids", listingIds).executeUpdate();
            em.createQuery("delete from Interest i where i.listing.id in :ids").setParameter("ids", listingIds).executeUpdate();
        }
        for (Listing listing : listings) {
            listing.setActive(false);
            listing.setAvailable(false);
            listing.setTitle("Anúncio removido");
            listing.setDescription(null);
            listing.setAddress(null);
            listing.setLatitude(null);
            listing.setLongitude(null);
            listing.setPreferredNeighborhood(null);
            listing.setNearCollege(null);
        }

        // Perfil de convivência (orphanRemoval apaga a linha) e, por último, a própria conta.
        user.setProfile(null);
        user.anonymize(passwordEncoder.encode(UUID.randomUUID() + UUID.randomUUID().toString()));

        log.info("Conta {} excluída a pedido do titular (dados pessoais anonimizados)", userId);
    }

    private void bulk(String jpql, Long userId) {
        em.createQuery(jpql).setParameter("id", userId).executeUpdate();
    }
}
