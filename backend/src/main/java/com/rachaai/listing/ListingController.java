package com.rachaai.listing;

import com.rachaai.listing.dto.ListingRequest;
import com.rachaai.listing.dto.ListingResponse;
import com.rachaai.listing.dto.MarkUnavailableRequest;
import com.rachaai.security.SecurityUser;
import com.rachaai.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping("/mine")
    public List<ListingResponse> mine(@AuthenticationPrincipal SecurityUser principal) {
        return listingService.listMine(principal.getId());
    }

    @PostMapping
    public ListingResponse create(
            @AuthenticationPrincipal SecurityUser principal,
            @Valid @RequestBody ListingRequest request
    ) {
        return ListingResponse.from(listingService.create(principal.getId(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long id) {
        listingService.delete(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/contatos-chat")
    public List<UserResponse> chatContacts(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long id) {
        return listingService.listChatContacts(principal.getId(), id);
    }

    @PostMapping("/{id}/indisponivel")
    public ListingResponse markUnavailable(
            @AuthenticationPrincipal SecurityUser principal,
            @PathVariable Long id,
            @RequestBody MarkUnavailableRequest request
    ) {
        return listingService.markUnavailable(principal.getId(), id, request.closedWithUserId());
    }

    @PostMapping("/{id}/disponivel")
    public ListingResponse markAvailable(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long id) {
        return listingService.markAvailable(principal.getId(), id);
    }
}
