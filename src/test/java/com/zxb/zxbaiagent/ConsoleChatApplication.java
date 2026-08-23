package com.zxb.zxbaiagent;

import com.zxb.ZxbAiAgentApplication;
import com.zxb.app.LoveApp;
import java.util.Scanner;
import java.util.UUID;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

public final class ConsoleChatApplication {

    private ConsoleChatApplication() {
    }

    public static void main(String[] args) {
        try (ConfigurableApplicationContext context = new SpringApplicationBuilder(ZxbAiAgentApplication.class)
                .web(WebApplicationType.NONE).run(args); Scanner scanner = new Scanner(System.in)) {
            LoveApp loveApp = context.getBean(LoveApp.class);
            String chatId = UUID.randomUUID().toString();

            System.out.println("Start chatting. Enter 'exit' or 'quit' to stop.");
            while (true) {
                System.out.print("You: ");
                System.out.flush();
                if (!scanner.hasNextLine()) {
                    break;
                }

                String message = scanner.nextLine().trim();
                if ("exit".equalsIgnoreCase(message) || "quit".equalsIgnoreCase(message)) {
                    break;
                }
                if (message.isEmpty()) {
                    continue;
                }

                String response = loveApp.doChat(message, chatId);
                System.out.println("AI: " + response);
            }
        }
    }
}
