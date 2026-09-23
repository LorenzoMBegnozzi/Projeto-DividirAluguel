package com.rachaai.rating;

import com.rachaai.common.ApiException;
import com.rachaai.notification.NotificationService;
import com.rachaai.notification.NotificationType;
import com.rachaai.rating.dto.AvaliacaoRequest;
import com.rachaai.rating.dto.AvaliacaoResponse;
import com.rachaai.rating.dto.AvaliacaoResumoResponse;
import com.rachaai.rating.dto.ConvivioRequest;
import com.rachaai.rating.dto.ConvivioResponse;
import com.rachaai.user.User;
import com.rachaai.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RatingService {

    private final ConvivioRepository convivioRepository;
    private final AvaliacaoRepository avaliacaoRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public RatingService(
            ConvivioRepository convivioRepository,
            AvaliacaoRepository avaliacaoRepository,
            UserRepository userRepository,
            NotificationService notificationService
    ) {
        this.convivioRepository = convivioRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public ConvivioResponse proposeConvivio(Long userId, ConvivioRequest request) {
        if (request.outroUsuarioId().equals(userId)) {
            throw ApiException.badRequest("Você não pode registrar um convívio com você mesmo");
        }
        if (request.periodoFim() != null && request.periodoFim().isBefore(request.periodoInicio())) {
            throw ApiException.badRequest("O fim do período não pode ser antes do início");
        }

        User user = requireUser(userId);
        User outro = requireUser(request.outroUsuarioId());

        Long menorId = Math.min(userId, request.outroUsuarioId());
        Long maiorId = Math.max(userId, request.outroUsuarioId());
        convivioRepository.findByParOrdenado(menorId, maiorId).ifPresent(c -> {
            throw ApiException.conflict("Já existe um convívio registrado com esse usuário");
        });

        User usuario1 = userId.equals(menorId) ? user : outro;
        User usuario2 = userId.equals(menorId) ? outro : user;
        Convivio convivio = convivioRepository.save(
                new Convivio(usuario1, usuario2, userId, request.periodoInicio(), request.periodoFim()));

        notificationService.notify(
                outro,
                NotificationType.CONVIVIO_PROPOSTO,
                user.getName() + " quer registrar um convívio com você",
                "Confirme se vocês realmente moraram juntos para poder avaliar um ao outro",
                "/convivios"
        );

        return ConvivioResponse.from(convivio, userId, false);
    }

    @Transactional(readOnly = true)
    public List<ConvivioResponse> listMine(Long userId) {
        return convivioRepository.findAllByUsuario(userId).stream()
                .map(c -> ConvivioResponse.from(
                        c, userId,
                        c.getStatus() == ConvivioStatus.CONFIRMADO && jaAvaliei(userId, c.getId())
                ))
                .toList();
    }

    @Transactional
    public ConvivioResponse confirmar(Long userId, Long convivioId) {
        Convivio convivio = requireParticipante(userId, convivioId);
        if (convivio.getPropostoPorId().equals(userId)) {
            throw ApiException.forbidden("Quem propôs o convívio não pode confirmá-lo");
        }
        if (convivio.getStatus() != ConvivioStatus.PENDENTE) {
            throw ApiException.conflict("Esse convívio já foi respondido");
        }
        convivio.confirmar();

        notificationService.notify(
                userRepository.getReferenceById(convivio.getPropostoPorId()),
                NotificationType.CONVIVIO_CONFIRMADO,
                convivio.getOutroUsuario(convivio.getPropostoPorId()).getName() + " confirmou o convívio",
                "Agora vocês já podem se avaliar",
                "/convivios"
        );

        return ConvivioResponse.from(convivio, userId, false);
    }

    @Transactional
    public ConvivioResponse recusar(Long userId, Long convivioId) {
        Convivio convivio = requireParticipante(userId, convivioId);
        if (convivio.getPropostoPorId().equals(userId)) {
            throw ApiException.forbidden("Quem propôs o convívio não pode recusá-lo");
        }
        if (convivio.getStatus() != ConvivioStatus.PENDENTE) {
            throw ApiException.conflict("Esse convívio já foi respondido");
        }
        convivio.recusar();

        notificationService.notify(
                userRepository.getReferenceById(convivio.getPropostoPorId()),
                NotificationType.CONVIVIO_RECUSADO,
                convivio.getOutroUsuario(convivio.getPropostoPorId()).getName() + " recusou o convívio",
                null,
                "/convivios"
        );

        return ConvivioResponse.from(convivio, userId, false);
    }

    public boolean jaAvaliei(Long userId, Long convivioId) {
        return avaliacaoRepository.existsByConvivioIdAndAvaliadorId(convivioId, userId);
    }

    @Transactional
    public AvaliacaoResponse avaliar(Long userId, AvaliacaoRequest request) {
        Convivio convivio = convivioRepository.findById(request.convivioId())
                .orElseThrow(() -> ApiException.notFound("Convívio não encontrado"));
        if (!convivio.envolve(userId)) {
            throw ApiException.forbidden("Você não faz parte desse convívio");
        }
        if (convivio.getStatus() != ConvivioStatus.CONFIRMADO) {
            throw ApiException.badRequest("Só é possível avaliar um convívio confirmado por ambos");
        }
        if (avaliacaoRepository.existsByConvivioIdAndAvaliadorId(convivio.getId(), userId)) {
            throw ApiException.conflict("Você já avaliou esse convívio");
        }

        User avaliador = requireUser(userId);
        User avaliado = convivio.getOutroUsuario(userId);
        Avaliacao avaliacao = avaliacaoRepository.save(new Avaliacao(
                convivio, avaliador, avaliado, request.notaPontualidade(), request.notaConvivencia(),
                request.comentario()
        ));

        notificationService.notify(
                avaliado,
                NotificationType.AVALIACAO_RECEBIDA,
                avaliador.getName() + " te avaliou",
                "Veja o que " + avaliador.getName() + " disse sobre morar com você",
                "/usuarios/" + avaliado.getId()
        );

        return AvaliacaoResponse.from(avaliacao);
    }

    @Transactional(readOnly = true)
    public List<Avaliacao> listRecebidas(Long usuarioId) {
        return avaliacaoRepository.findAllByAvaliadoIdOrderByCriadoEmDesc(usuarioId);
    }

    @Transactional(readOnly = true)
    public List<AvaliacaoResponse> listRecebidasResponses(Long usuarioId) {
        return listRecebidas(usuarioId).stream().map(AvaliacaoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AvaliacaoResumoResponse resumo(Long usuarioId) {
        List<Avaliacao> avaliacoes = listRecebidas(usuarioId);
        if (avaliacoes.isEmpty()) {
            return new AvaliacaoResumoResponse(0, 0, 0);
        }
        double mediaPontualidade = avaliacoes.stream().mapToInt(Avaliacao::getNotaPontualidade).average().orElse(0);
        double mediaConvivencia = avaliacoes.stream().mapToInt(Avaliacao::getNotaConvivencia).average().orElse(0);
        return new AvaliacaoResumoResponse(avaliacoes.size(), mediaPontualidade, mediaConvivencia);
    }

    private Convivio requireParticipante(Long userId, Long convivioId) {
        Convivio convivio = convivioRepository.findById(convivioId)
                .orElseThrow(() -> ApiException.notFound("Convívio não encontrado"));
        if (!convivio.envolve(userId)) {
            throw ApiException.forbidden("Você não faz parte desse convívio");
        }
        return convivio;
    }

    private User requireUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Usuário não encontrado"));
    }
}
