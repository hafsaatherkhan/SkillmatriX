package com.career.skillanalyzer.Controller;

import com.career.skillanalyzer.DTO.MessageRequest;
import com.career.skillanalyzer.entity.chat.ChatMessage;
import com.career.skillanalyzer.service.chatbot.CounsellingService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin
@RestController
@RequestMapping("/api/chat")
public class CounsellingController {

    private final CounsellingService counsellingService;

    public CounsellingController(CounsellingService counsellingService) {
        this.counsellingService = counsellingService;
    }

    @PostMapping("/message")
    public String sendMessage(@RequestBody MessageRequest request) {
        return counsellingService.processMessage(request.getSessionId(), request.getContent());
    }

    @GetMapping("/history/{sessionId}")
    public List<ChatMessage> getHistory(@PathVariable Long sessionId) {
        return counsellingService.getHistory(sessionId);
    }

    // Fallback for manual session creation if needed
    @PostMapping("/session")
    public com.career.skillanalyzer.DTO.SessionResponse createSession(@RequestBody Map<String, Object> payload) {
        return counsellingService.createSession(
                (String) payload.get("userId"),
                (String) payload.get("targetRole"),
                Double.valueOf(payload.get("matchPercentage").toString()),
                payload.get("cvSkills"),
                (Map<String, Object>) payload.get("skillGap"));
    }
}
