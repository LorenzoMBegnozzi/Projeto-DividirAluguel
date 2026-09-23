package com.rachaai.rating;

import com.rachaai.rating.dto.AvaliacaoRequest;
import com.rachaai.rating.dto.AvaliacaoResponse;
import com.rachaai.rating.dto.AvaliacaoResumoResponse;
import com.rachaai.rating.dto.ConvivioRequest;
import com.rachaai.rating.dto.ConvivioResponse;
import com.rachaai.security.SecurityUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class RatingController {

    private final RatingService ratingService;

    public RatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @PostMapping("/api/convivios")
    public ConvivioResponse proposeConvivio(
            @AuthenticationPrincipal SecurityUser principal,
            @Valid @RequestBody ConvivioRequest request
    ) {
        return ratingService.proposeConvivio(principal.getId(), request);
    }

    @GetMapping("/api/convivios")
    public List<ConvivioResponse> listMyConvivios(@AuthenticationPrincipal SecurityUser principal) {
        return ratingService.listMine(principal.getId());
    }

    @PostMapping("/api/convivios/{id}/confirmar")
    public ConvivioResponse confirmar(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long id) {
        return ratingService.confirmar(principal.getId(), id);
    }

    @PostMapping("/api/convivios/{id}/recusar")
    public ConvivioResponse recusar(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long id) {
        return ratingService.recusar(principal.getId(), id);
    }

    @PostMapping("/api/avaliacoes")
    public AvaliacaoResponse avaliar(
            @AuthenticationPrincipal SecurityUser principal,
            @Valid @RequestBody AvaliacaoRequest request
    ) {
        return ratingService.avaliar(principal.getId(), request);
    }

    @GetMapping("/api/usuarios/{id}/avaliacoes")
    public List<AvaliacaoResponse> listReceived(@PathVariable Long id) {
        return ratingService.listRecebidasResponses(id);
    }

    @GetMapping("/api/usuarios/{id}/avaliacoes/resumo")
    public AvaliacaoResumoResponse summary(@PathVariable Long id) {
        return ratingService.resumo(id);
    }
}
