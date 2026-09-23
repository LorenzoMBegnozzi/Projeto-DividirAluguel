package com.rachaai.interest;

import com.rachaai.interest.dto.InterestStatusResponse;
import com.rachaai.security.SecurityUser;
import com.rachaai.user.dto.UserResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings/{listingId}/interest")
public class InterestController {

    private final InterestService interestService;

    public InterestController(InterestService interestService) {
        this.interestService = interestService;
    }

    @GetMapping
    public InterestStatusResponse status(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long listingId) {
        return interestService.status(principal.getId(), listingId);
    }

    @PostMapping
    public InterestStatusResponse mark(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long listingId) {
        return interestService.markInterest(principal.getId(), listingId);
    }

    @DeleteMapping
    public InterestStatusResponse unmark(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long listingId) {
        return interestService.unmarkInterest(principal.getId(), listingId);
    }

    @GetMapping("/people")
    public List<UserResponse> people(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long listingId) {
        return interestService.listInterested(principal.getId(), listingId);
    }
}
