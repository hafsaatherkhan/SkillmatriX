package com.career.skillanalyzer.service.chatbot;

import com.google.gson.Gson;
import com.career.skillanalyzer.entity.chat.ChatMessage;
import com.career.skillanalyzer.entity.chat.ChatSession;
import com.career.skillanalyzer.repository.ChatMessageRepository;
import com.career.skillanalyzer.repository.ChatSessionRepository;
import com.career.skillanalyzer.service.chatbot.CounsellingAIService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class CounsellingService {

        private final ChatSessionRepository sessionRepository;
        private final ChatMessageRepository messageRepository;
        private final CounsellingAIService aiService;
        private final Gson gson = new Gson();

        public CounsellingService(
                        ChatSessionRepository sessionRepository,
                        ChatMessageRepository messageRepository,
                        CounsellingAIService aiService) {
                this.sessionRepository = sessionRepository;
                this.messageRepository = messageRepository;
                this.aiService = aiService;
        }

        @Transactional
        public com.career.skillanalyzer.DTO.SessionResponse createSession(
                        String userId,
                        String targetRole,
                        Double matchPercentage,
                        Object cvSkills,
                        Map<String, Object> skillGap) {

                ChatSession session = ChatSession.builder()
                                .userId(userId)
                                .targetRole(targetRole)
                                .matchPercentage(matchPercentage)
                                .cvSkills(gson.toJson(cvSkills))
                                .skillGap(gson.toJson(skillGap))
                                .build();

                ChatSession savedSession = sessionRepository.save(session);

                // Check if we have skill data
                boolean hasSkillData = checkHasSkillData(cvSkills, skillGap);
                String message = hasSkillData
                                ? "Session created with skill data"
                                : "No skills detected. Please upload resume.";

                return com.career.skillanalyzer.DTO.SessionResponse.builder()
                                .sessionId(savedSession.getId())
                                .hasSkillData(hasSkillData)
                                .message(message)
                                .build();
        }

        private boolean checkHasSkillData(Object cvSkills, Map<String, Object> skillGap) {
                // Check cvSkills
                boolean hasCvSkills = false;
                if (cvSkills instanceof List) {
                        hasCvSkills = !((List<?>) cvSkills).isEmpty();
                }

                // Check skillGap
                boolean hasGapSkills = false;
                if (skillGap != null) {
                        List<?> missing = (List<?>) skillGap.get("Missing");
                        List<?> weak = (List<?>) skillGap.get("Weak");
                        hasGapSkills = (missing != null && !missing.isEmpty()) || (weak != null && !weak.isEmpty());
                }

                return hasCvSkills || hasGapSkills;
        }

        @Transactional
        public String processMessage(Long sessionId, String content) {
                ChatSession session = sessionRepository.findById(sessionId)
                                .orElseThrow(() -> new RuntimeException("Session not found with ID: " + sessionId));

                // 1. Persist User Message
                ChatMessage userMessage = ChatMessage.builder()
                                .session(session)
                                .role("user")
                                .content(content)
                                .build();
                messageRepository.save(userMessage);

                // 2. Fetch last 10 messages for a sliding window context (saves tokens)
                List<ChatMessage> history = messageRepository.findBySessionIdOrderByTimestampDesc(
                                sessionId, PageRequest.of(0, 10));
                Collections.reverse(history); // Put back in chronological order for the AI

                // 3. Generate AI Response
                String aiText = aiService.generateResponse(
                                session.getTargetRole(),
                                session.getCvSkills(),
                                session.getSkillGap(),
                                history);

                // 4. Persist Assistant Response
                ChatMessage assistantMessage = ChatMessage.builder()
                                .session(session)
                                .role("assistant")
                                .content(aiText)
                                .build();
                messageRepository.save(assistantMessage);

                return aiText;
        }

        public List<ChatMessage> getHistory(Long sessionId) {
                return messageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
        }
}
