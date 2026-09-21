package com.rachaai.match;

import com.rachaai.match.dto.BrowseItemResponse;
import com.rachaai.security.SecurityUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/browse")
public class DiscoveryController {

    private final DiscoveryService discoveryService;

    public DiscoveryController(DiscoveryService discoveryService) {
        this.discoveryService = discoveryService;
    }

    @GetMapping("/roommates")
    public List<BrowseItemResponse> roommates(@AuthenticationPrincipal SecurityUser principal) {
        return discoveryService.browseRoommates(principal.getId());
    }

    @GetMapping("/establishments")
    public List<BrowseItemResponse> establishments(@AuthenticationPrincipal SecurityUser principal) {
        return discoveryService.browseEstablishments(principal.getId());
    }
}
