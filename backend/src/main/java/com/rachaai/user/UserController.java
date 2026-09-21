package com.rachaai.user;

import com.rachaai.security.SecurityUser;
import com.rachaai.user.dto.ProfileRequest;
import com.rachaai.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal SecurityUser principal) {
        return UserResponse.from(userService.getById(principal.getId()));
    }

    @PutMapping("/me/profile")
    public UserResponse updateProfile(
            @AuthenticationPrincipal SecurityUser principal,
            @Valid @RequestBody ProfileRequest request
    ) {
        return UserResponse.from(userService.updateProfile(principal.getId(), request));
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return UserResponse.from(userService.getById(id));
    }

    @PostMapping("/me/aceitar-termos")
    public UserResponse acceptSafetyTerms(@AuthenticationPrincipal SecurityUser principal) {
        return UserResponse.from(userService.acceptSafetyTerms(principal.getId()));
    }
}
