package com.zxb.config;

import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.api.AdvisorChain;
import org.springframework.ai.chat.client.advisor.api.BaseAdvisor;

/**
 * 自定义顾问类 Author: zxb CreateTime: 2026/8/28 Project: zxb-ai-agent
 */
public class MyCustomAdvisor implements BaseAdvisor {

    /**
     * 前置处理
     *
     * @param chatClientRequest
     *            请求对象
     * @param advisorChain
     *            顾问链
     * @return 处理后的请求对象
     */
    @Override
    public ChatClientRequest before(ChatClientRequest chatClientRequest, AdvisorChain advisorChain) {
        System.out.println("Before(print user message): " + chatClientRequest.prompt().getUserMessage());
        return chatClientRequest;
    }

    /**
     * 后置处理
     *
     * @param chatClientResponse
     *            响应对象
     * @param advisorChain
     *            顾问链
     * @return 处理后的响应对象
     */
    @Override
    public ChatClientResponse after(ChatClientResponse chatClientResponse, AdvisorChain advisorChain) {
        System.out.println(
                "After(print response): " + chatClientResponse.chatResponse().getResult().getOutput().getText());
        return chatClientResponse;
    }

    /**
     * 获取顾问的顺序
     *
     * @return 顺序
     */
    @Override
    public int getOrder() {
        return 0;
    }
}
