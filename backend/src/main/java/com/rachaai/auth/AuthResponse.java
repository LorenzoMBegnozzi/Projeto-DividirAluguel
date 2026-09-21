package com.rachaai.auth;

import com.rachaai.user.dto.UserResponse;

public record AuthResponse(String token, UserResponse user) {
}
