package com.rachaai.user;

import com.rachaai.auth.EmailConfirmationService;
import com.rachaai.common.ApiException;
import com.rachaai.security.SecurityUser;
import com.rachaai.user.dto.DeleteAccountRequest;
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
    private final AccountDeletionService accountDeletionService;
    private final EmailConfirmationService emailConfirmationService;

    public UserController(
            UserService userService,
            AccountDeletionService accountDeletionService,
            EmailConfirmationService emailConfirmationService
    ) {
        this.userService = userService;
        this.accountDeletionService = accountDeletionService;
        this.emailConfirmationService = emailConfirmationService;
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
        if (user.isDeleted()) {
            throw ApiException.notFound("Usuário não encontrado");
        }
        return UserResponse.publicFrom(user, userService.hasPhoto(id));
    }

    /** "Reenviar e-mail" de confirmação (até 3 por hora). */
    @PostMapping("/me/reenviar-confirmacao")
    public ResponseEntity<Void> resendEmailConfirmation(@AuthenticationPrincipal SecurityUser principal) {
        emailConfirmationService.resend(principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/me/aceitar-politicas")
    public UserResponse acceptLegalTerms(@AuthenticationPrincipal SecurityUser principal) {
        User user = userService.acceptLegalTerms(principal.getId());
        return UserResponse.from(user, userService.hasPhoto(user.getId()));
    }

    /** Exclui a conta (LGPD). Pede a senha de novo para confirmar. Ver AccountDeletionService. */
    @PostMapping("/me/excluir-conta")
    public ResponseEntity<Void> deleteAccount(
            @AuthenticationPrincipal SecurityUser principal,
            @Valid @RequestBody DeleteAccountRequest request
    ) {
        accountDeletionService.deleteAccount(principal.getId(), request.password());
        return ResponseEntity.noContent().build();
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
