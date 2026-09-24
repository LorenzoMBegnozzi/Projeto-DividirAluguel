package com.rachaai.auth;

/** Resposta sempre genérica: nunca revela se o e-mail tem conta nem devolve o token. */
public record ForgotPasswordResponse(String message) {
}
