package com.zxb.zxbaiagent;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Spring AI 多轮对话 Demo 测试
 * <p>
 * 演示使用 ChatClient 和 MessageChatMemoryAdvisor 实现上下文保持的多轮对话
 * </p>
 */
@Slf4j
@SpringBootTest
class MultiTurnConversationDemoTest {

    @Autowired
    private ChatModel chatModel;

    @Test
    void testMultiTurnConversation() {
        // 创建聊天内存，用于保存对话历史（保留最近 10 条消息）
        ChatMemory chatMemory = MessageWindowChatMemory.builder().maxMessages(10).build();

        // 会话 ID，用于区分不同的对话会话
        String conversationId = "demo-conversation-001";

        // 构建 ChatClient，配置 MessageChatMemoryAdvisor
        ChatClient chatClient = ChatClient.builder(chatModel)
                .defaultSystem("你是一位专业的 Java 技术顾问，擅长 Spring 生态系统。请用简洁、友好的方式回答问题，并记住对话上下文。")
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build()).build();

        log.info("========== Spring AI 多轮对话 Demo ==========\n");

        // 第一轮对话：介绍自己
        log.info("【第 1 轮】用户：我叫张三，是一名 Java 开发工程师。");
        String response1 = chatClient.prompt().user("我叫张三，是一名 Java 开发工程师。")
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId)).call().content();
        log.info("AI 回复：{}", response1);

        // 第二轮对话：询问关于 Spring 的问题
        log.info("【第 2 轮】用户：Spring Boot 和 Spring Framework 有什么区别？");
        String response2 = chatClient.prompt().user("Spring Boot 和 Spring Framework 有什么区别？")
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId)).call().content();
        log.info("AI 回复：{}", response2);

        // 第三轮对话：测试上下文记忆（AI 应该记得用户的名字）
        log.info("【第 3 轮】用户：你还记得我叫什么名字吗？");
        String response3 = chatClient.prompt().user("你还记得我叫什么名字吗？")
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId)).call().content();
        log.info("AI 回复：{}", response3);

        log.info("========== 对话结束 ==========");

        // 验证 AI 能够记住用户姓名
        assert response3.contains("张三") : "AI 应该能够记住用户的名字";
    }
}
