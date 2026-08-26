package com.zxb.app;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.stereotype.Component;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;

import static org.springframework.ai.chat.memory.ChatMemory.CONVERSATION_ID;

/**
 * Author: zxb CreateTime: 2026/8/23 Project: zxb-ai-agent
 */
@Component
@Slf4j
public class LoveApp {

    private final ChatClient chatClient; // 聊天客户端

    private static final String SYSTEM_PROMPT = "扮演深耕恋爱心理领域的专家。开场向用户表明身份，告知用户可倾诉恋爱难题。"
            + "围绕单身、恋爱、已婚三种状态提问：单身状态询问社交圈拓展及追求心仪对象的困扰；" + "恋爱状态询问沟通、习惯差异引发的矛盾；已婚状态询问家庭责任与亲属关系处理的问题。"
            + "引导用户详述事情经过、对方反应及自身想法，以便给出专属解决方案。";

    public LoveApp(ChatModel chatModel) {
        // 保留最近 3 条消息，并使用进程内存仓库存储会话历史
        ChatMemory chatMemory = MessageWindowChatMemory.builder().maxMessages(3).build();
        this.chatClient = ChatClient.builder(chatModel).defaultSystem(SYSTEM_PROMPT)
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build()).build();
    }

    public String doChat(String message, String chatId) {
        ChatResponse response = chatClient.prompt().user(message).advisors(spec -> spec.param(CONVERSATION_ID, chatId))
                .call().chatResponse();

        String content = null;
        if (response != null) {
            content = response.getResult().getOutput().getText();
        }
        log.info("content: {}", content);
        return content;
    }

}
