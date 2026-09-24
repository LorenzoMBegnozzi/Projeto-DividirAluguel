package com.rachaai.user;

import com.rachaai.common.ApiException;
import com.rachaai.security.SecurityUser;
import com.rachaai.user.dto.EnableAdvertiserRequest;
import com.rachaai.user.dto.ProfileRequest;
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
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal SecurityUser principal) {
        User user = userService.getById(principal.getId());
        return UserResponse.from(user, userService.hasPhoto(user.getId()));
    }

    @PutMapping("/me/profile")
    public UserResponse updateProfile(
            @AuthenticationPrincipal SecurityUser principal,
            @Valid @RequestBody ProfileRequest request
    ) {
        User user = userService.updateProfile(principal.getId(), request);
        return UserResponse.from(user, userService.hasPhoto(user.getId()));
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        User user = userService.getById(id);
        return UserResponse.from(user, userService.hasPhoto(id));
    }

    @PostMapping("/me/aceitar-termos")
    public UserResponse acceptSafetyTerms(@AuthenticationPrincipal SecurityUser principal) {
        User user = userService.acceptSafetyTerms(principal.getId());
        return UserResponse.from(user, userService.hasPhoto(user.getId()));
    }

    @PostMapping("/me/alugar")
    public UserResponse enableRenter(@AuthenticationPrincipal SecurityUser principal) {
        User user = userService.enableRenter(principal.getId());
        return UserResponse.from(user, userService.hasPhoto(user.getId()));
    }

    @PostMapping("/me/anunciar")
    public UserResponse enableAdvertiser(
            @AuthenticationPrincipal SecurityUser principal,
            @Valid @RequestBody EnableAdvertiserRequest request
    ) {
        User user = userService.enableAdvertiser(principal.getId(), request.advertiserKind());
        return UserResponse.from(user, userService.hasPhoto(user.getId()));
    }

    @PostMapping(value = "/me/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> uploadPhoto(
            @AuthenticationPrincipal SecurityUser principal,
            @RequestParam("file") MultipartFile file
    ) {
        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException e) {
            throw ApiException.badRequest("Não foi possível ler o arquivo enviado");
        }
        userService.uploadPhoto(principal.getId(), content, file.getContentType(), file.getSize());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me/foto")
    public ResponseEntity<Void> deletePhoto(@AuthenticationPrincipal SecurityUser principal) {
        userService.removePhoto(principal.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/foto")
    public ResponseEntity<byte[]> getPhoto(@PathVariable Long id) {
        UserPhoto photo = userService.getPhoto(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.getContentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePublic())
                .body(photo.getContent());
    }
}
