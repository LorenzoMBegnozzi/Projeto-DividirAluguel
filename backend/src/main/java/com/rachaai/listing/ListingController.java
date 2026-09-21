package com.rachaai.listing;

import com.rachaai.listing.dto.ListingRequest;
import com.rachaai.listing.dto.ListingResponse;
import com.rachaai.security.SecurityUser;
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
        return listingService.listMine(principal.getId()).stream().map(ListingResponse::from).toList();
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
}
