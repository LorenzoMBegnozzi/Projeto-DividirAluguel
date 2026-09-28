package com.rachaai.billing;

import com.rachaai.billing.dto.PaymentRequest;
import com.rachaai.billing.dto.PaymentResponse;
import com.rachaai.billing.dto.PlanResponse;
import com.rachaai.security.SecurityUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping("/plan")
    public PlanResponse plan(@AuthenticationPrincipal SecurityUser principal) {
        return billingService.plan(principal.getId());
    }

    @GetMapping("/payments")
    public List<PaymentResponse> list(@AuthenticationPrincipal SecurityUser principal) {
        return billingService.listMine(principal.getId()).stream().map(PaymentResponse::from).toList();
    }

    @PostMapping("/payments")
    public PaymentResponse create(
            @AuthenticationPrincipal SecurityUser principal,
            @Valid @RequestBody PaymentRequest request
    ) {
        return PaymentResponse.from(billingService.createPayment(principal.getId(), request));
    }

    /** Pergunta ao gateway como está o pagamento (usado ao voltar do checkout e ao abrir a tela). */
    @PostMapping("/payments/{id}/sincronizar")
    public PaymentResponse sync(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long id) {
        return PaymentResponse.from(billingService.syncWithGateway(principal.getId(), id));
    }

    @PostMapping("/payments/{id}/cancelar")
    public PaymentResponse cancel(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long id) {
        return PaymentResponse.from(billingService.cancel(principal.getId(), id));
    }

    /**
     * Aviso automático do Mercado Pago (webhook). Público (quem chama é o Mercado Pago), por isso
     * confere a assinatura e reconsulta o pagamento na API antes de aplicar qualquer coisa.
     * O id vem na query (?data.id=...&type=payment) e/ou no corpo ({"type":"payment","data":{"id":...}}).
     */
    @PostMapping("/webhook/mercadopago")
    public org.springframework.http.ResponseEntity<Void> mercadoPagoWebhook(
            @RequestParam(name = "data.id", required = false) String dataIdParam,
            @RequestParam(name = "type", required = false) String typeParam,
            @RequestBody(required = false) com.fasterxml.jackson.databind.JsonNode body,
            @RequestHeader(name = "x-signature", required = false) String signature,
            @RequestHeader(name = "x-request-id", required = false) String requestId
    ) {
        String type = typeParam != null ? typeParam : body != null ? body.path("type").asText(null) : null;
        String dataId = dataIdParam != null ? dataIdParam : body != null ? body.path("data").path("id").asText(null) : null;
        if ("payment".equals(type) && dataId != null && !dataId.isBlank()) {
            billingService.handleWebhook(dataId, signature, requestId);
        }
        // 200 sempre que o aviso foi entendido: senão o Mercado Pago fica reenviando.
        return org.springframework.http.ResponseEntity.ok().build();
    }

    @PostMapping("/payments/{id}/simulate")
    public PaymentResponse simulate(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long id) {
        return PaymentResponse.from(billingService.simulateConfirmation(principal.getId(), id));
    }
}
