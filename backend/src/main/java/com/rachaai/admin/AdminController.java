package com.rachaai.admin;

import com.rachaai.admin.dto.AdminDtos;
import com.rachaai.moderation.ReportStatus;
import com.rachaai.security.SecurityUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Área administrativa. Tudo aqui exige ROLE_ADMIN (ver SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/resumo")
    public AdminDtos.Summary summary() {
        return adminService.summary();
    }

    @GetMapping("/denuncias")
    public List<AdminDtos.Report> reports(@RequestParam(required = false) ReportStatus status) {
        return adminService.listReports(status);
    }

    @PostMapping("/denuncias/{id}/fechar")
    public AdminDtos.Report closeReport(
            @AuthenticationPrincipal SecurityUser principal,
            @PathVariable Long id,
            @Valid @RequestBody AdminDtos.CloseReportRequest request
    ) {
        return adminService.closeReport(principal.getId(), id, request);
    }

    @GetMapping("/usuarios")
    public List<AdminDtos.User> users(@RequestParam(required = false) String busca) {
        return adminService.listUsers(busca);
    }

    @PostMapping("/usuarios/{id}/bloquear")
    public AdminDtos.User block(
            @AuthenticationPrincipal SecurityUser principal,
            @PathVariable Long id,
            @Valid @RequestBody AdminDtos.BlockRequest request
    ) {
        return adminService.blockUser(principal.getId(), id, request);
    }

    @PostMapping("/usuarios/{id}/desbloquear")
    public AdminDtos.User unblock(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long id) {
        return adminService.unblockUser(principal.getId(), id);
    }

    @GetMapping("/anuncios")
    public List<AdminDtos.Listing> listings(@RequestParam(required = false) String busca) {
        return adminService.listListings(busca);
    }

    @PostMapping("/anuncios/{id}/desativar")
    public AdminDtos.Listing deactivateListing(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long id) {
        return adminService.deactivateListing(principal.getId(), id);
    }
}
