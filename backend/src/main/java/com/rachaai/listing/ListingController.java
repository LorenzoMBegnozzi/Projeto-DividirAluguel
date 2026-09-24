package com.rachaai.listing;

import com.rachaai.common.ApiException;
import com.rachaai.listing.dto.ListingRequest;
import com.rachaai.listing.dto.ListingResponse;
import com.rachaai.listing.dto.MarkUnavailableRequest;
import com.rachaai.security.SecurityUser;
import com.rachaai.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
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

    @GetMapping("/{id}")
    public ListingResponse getById(@PathVariable Long id) {
        return listingService.getById(id);
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

    @GetMapping("/{id}/fotos")
    public List<String> listPhotos(@PathVariable Long id) {
        return listingService.listPhotoUrls(id);
    }

    @PostMapping(value = "/{id}/fotos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> uploadPhoto(
            @AuthenticationPrincipal SecurityUser principal,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {
        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException e) {
            throw ApiException.badRequest("Não foi possível ler o arquivo enviado");
        }
        listingService.addPhoto(principal.getId(), id, content, file.getContentType(), file.getSize());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/fotos/{photoId}")
    public ResponseEntity<byte[]> getPhoto(@PathVariable Long id, @PathVariable Long photoId) {
        ListingPhoto photo = listingService.getPhoto(id, photoId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.getContentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePublic())
                .body(photo.getContent());
    }

    @DeleteMapping("/{id}/fotos/{photoId}")
    public ResponseEntity<Void> deletePhoto(
            @AuthenticationPrincipal SecurityUser principal,
            @PathVariable Long id,
            @PathVariable Long photoId
    ) {
        listingService.removePhoto(principal.getId(), id, photoId);
        return ResponseEntity.noContent().build();
    }
}
