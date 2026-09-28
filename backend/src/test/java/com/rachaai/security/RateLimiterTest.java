package com.rachaai.security;

import com.rachaai.common.ApiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Limite de tentativas (RateLimiter)")
class RateLimiterTest {

    private final RateLimiter limiter = new RateLimiter(5, 20, 5, 5, 3, 10, 3);

    @Test
    @DisplayName("deixa passar até o máximo e barra o seguinte com 429")
    void blocksAfterMax() {
        for (int i = 0; i < 5; i++) {
            limiter.hit(limiter.REGISTER_PER_IP, "1.1.1.1");
        }
        assertThatThrownBy(() -> limiter.hit(limiter.REGISTER_PER_IP, "1.1.1.1"))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS))
                .hasMessageContaining("Muitas tentativas");
    }

    @Test
    @DisplayName("cada chave tem o seu contador")
    void keysAreIndependent() {
        for (int i = 0; i < 5; i++) {
            limiter.hit(limiter.REGISTER_PER_IP, "2.2.2.2");
        }
        assertThatCode(() -> limiter.hit(limiter.REGISTER_PER_IP, "3.3.3.3")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("reset zera a chave (login certo apaga os erros)")
    void resetClearsKey() {
        for (int i = 0; i < 5; i++) {
            limiter.record(limiter.LOGIN_FAILURES_PER_EMAIL, "a@b.com");
        }
        assertThatThrownBy(() -> limiter.check(limiter.LOGIN_FAILURES_PER_EMAIL, "a@b.com")).isInstanceOf(ApiException.class);
        limiter.reset(limiter.LOGIN_FAILURES_PER_EMAIL, "a@b.com");
        assertThatCode(() -> limiter.check(limiter.LOGIN_FAILURES_PER_EMAIL, "A@B.COM ")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("check não conta tentativa; só record/hit contam")
    void checkDoesNotCount() {
        for (int i = 0; i < 50; i++) {
            limiter.check(limiter.LOGIN_FAILURES_PER_EMAIL, "c@d.com");
        }
        assertThatCode(() -> limiter.check(limiter.LOGIN_FAILURES_PER_EMAIL, "c@d.com")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("a janela libera de novo depois do prazo")
    void windowExpires() throws InterruptedException {
        RateLimiter.Limit tiny = new RateLimiter.Limit("teste", 2, Duration.ofMillis(200));
        limiter.hit(tiny, "k");
        limiter.hit(tiny, "k");
        assertThatThrownBy(() -> limiter.hit(tiny, "k")).isInstanceOf(ApiException.class);
        Thread.sleep(250);
        assertThatCode(() -> limiter.hit(tiny, "k")).doesNotThrowAnyException();
    }
}
