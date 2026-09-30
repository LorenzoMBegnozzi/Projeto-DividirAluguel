package com.rachaai.config;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Liga o RlsDataSource (identifica o usuário logado em cada conexão, para as políticas por linha
 * do Postgres). Desligado com app.rls.enabled=false, usado nos testes com H2, que não tem RLS.
 */
@Configuration
@ConditionalOnProperty(name = "app.rls.enabled", havingValue = "true", matchIfMissing = true)
public class RlsConfig {

    @Bean
    public static BeanPostProcessor rlsDataSourceWrapper() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) {
                if (bean instanceof DataSource dataSource && !(bean instanceof RlsDataSource)) {
                    return new RlsDataSource(dataSource);
                }
                return bean;
            }
        };
    }
}
