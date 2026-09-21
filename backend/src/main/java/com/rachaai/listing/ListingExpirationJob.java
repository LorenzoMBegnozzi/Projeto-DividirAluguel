package com.rachaai.listing;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/** Desativa os anúncios extras (pagos) cuja validade acabou. */
@Component
public class ListingExpirationJob {

    private static final Logger log = LoggerFactory.getLogger(ListingExpirationJob.class);

    private final ListingRepository listingRepository;

    public ListingExpirationJob(ListingRepository listingRepository) {
        this.listingRepository = listingRepository;
    }

    @Scheduled(fixedDelayString = "${app.billing.expiration-check}", initialDelayString = "${app.billing.expiration-check}")
    @Transactional
    public void deactivateExpiredListings() {
        int deactivated = listingRepository.deactivateExpired(Instant.now());
        if (deactivated > 0) {
            log.info("{} anúncio(s) extra(s) expirado(s) foram desativados", deactivated);
        }
    }
}
