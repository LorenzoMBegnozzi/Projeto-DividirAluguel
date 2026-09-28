package com.rachaai.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;

import java.util.Arrays;

/**
 * Rodando fora do Docker, a variável AMBIENTE escolhe o .env do projeto (ver application.yml).
 * Se o arquivo não existir, o import é opcional e o backend subiria como dev sem avisar (e
 * poderia conectar no banco errado). Aqui ele se recusa a subir quando o perfil ativo não bate
 * com o AMBIENTE pedido. Roda logo depois de carregar as configurações, antes de abrir qualquer
 * conexão com o banco. Registrado em META-INF/spring.factories.
 */
public class AmbienteGuard implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String ambiente = environment.getProperty("AMBIENTE");
        if (ambiente == null || ambiente.isBlank()) {
            return;
        }
        if (!Arrays.asList(environment.getActiveProfiles()).contains(ambiente)) {
            throw new IllegalStateException("AMBIENTE=" + ambiente + ", mas o perfil ativo é "
                    + Arrays.toString(environment.getActiveProfiles())
                    + ". Confira se o arquivo .env." + ambiente + " existe na raiz do projeto.");
        }
    }
}
