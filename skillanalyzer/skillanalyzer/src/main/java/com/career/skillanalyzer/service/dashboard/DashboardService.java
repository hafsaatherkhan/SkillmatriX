
package com.career.skillanalyzer.service.dashboard;

import com.career.skillanalyzer.DTO.DashboardSummaryResponse;
import com.career.skillanalyzer.entity.chat.ChatSession;
import com.career.skillanalyzer.Model.User;
import com.career.skillanalyzer.repository.ChatSessionRepository;
import com.career.skillanalyzer.repository.RoadmapRepository;
import com.career.skillanalyzer.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final Optional<RoadmapRepository> roadmapRepository; // optional if not present

    public DashboardService(
            UserRepository userRepository,
            ChatSessionRepository chatSessionRepository,
            Optional<RoadmapRepository> roadmapRepository // use Optional to avoid bean errors
    ) {
        this.userRepository = userRepository;
        this.chatSessionRepository = chatSessionRepository;
        this.roadmapRepository = roadmapRepository;
    }

    public DashboardSummaryResponse getSummary(String userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Latest sessions (for role + match %)
        List<ChatSession> latest = chatSessionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        ChatSession latestSession = latest.isEmpty() ? null : latest.get(0);

        String targetRole = latestSession != null ? nullSafe(latestSession.getTargetRole()) : "";
        Integer matchPercentage = latestSession != null && latestSession.getMatchPercentage() != null
                ? latestSession.getMatchPercentage().intValue()
                : 84; // UI default

        // === Stats mapping exactly for UI ===
        long roadmaps = roadmapRepository
                .map(r -> (long) r.countByUserId(userId))
                .orElseGet(() -> chatSessionRepository.countByUserId(userId));

        long reports = chatSessionRepository.countByUserId(userId); // or activity logs count if you prefer
        long resumes = 0; // if you add Resume entity or activity type, map it here

        DashboardSummaryResponse.Stats stats = DashboardSummaryResponse.Stats.builder()
                .roadmaps(roadmaps)
                .reports(reports)
                .resumes(resumes)
                .build();

        // === Skills breakdown (backend me abhi data nahi, 0s bhej do) ===
        DashboardSummaryResponse.Skills skills = DashboardSummaryResponse.Skills.builder()
                .strong(0).weak(0).missing(0).build();

        // === Jobs list (abhi empty; future me fill) ===
        List<DashboardSummaryResponse.JobItem> jobs = Collections.emptyList();

        return DashboardSummaryResponse.builder()
                .userName(nullSafe(user.getUsername())) // NOTE: frontend expects userName (camel-case N)
                .targetRole(targetRole)
                .stats(stats)
                .skills(skills)
                .jobs(jobs)
                .matchPercentage(matchPercentage)
                .build();
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }
}
