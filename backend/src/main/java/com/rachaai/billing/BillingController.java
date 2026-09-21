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

    @PostMapping("/payments/{id}/simulate")
    public PaymentResponse simulate(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long id) {
        return PaymentResponse.from(billingService.simulateConfirmation(principal.getId(), id));
    }
}
