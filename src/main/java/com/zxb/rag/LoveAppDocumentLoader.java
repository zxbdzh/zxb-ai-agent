package com.zxb.rag;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.markdown.MarkdownDocumentReader;
import org.springframework.ai.reader.markdown.config.MarkdownDocumentReaderConfig;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Component;

/**
 * Author: zxb CreateTime: 2026/9/13 Project: zxb-ai-agent
 */
@Slf4j
@Component
@AllArgsConstructor
public class LoveAppDocumentLoader {

    private final ResourcePatternResolver resourcePatternResolver; // 资源模式解析器

    public List<Document> loadMarkdowns() {
        List<Document> allDocuments = new ArrayList<>();
        try {
            // Markdown 文件的路径加载模式
            Resource[] resources = resourcePatternResolver.getResources("classpath:document/*.md");
            for (Resource resource : resources) {
                String filename = resource.getFilename();
                MarkdownDocumentReaderConfig config = null;
                if (filename != null) {
                    config = MarkdownDocumentReaderConfig.builder().withHorizontalRuleCreateDocument(true) // 设置是否将水平线创建为文档
                            .withIncludeCodeBlock(false) // 设置是否包含代码块
                            .withIncludeBlockquote(false) // 设置是否包含块引用
                            .withAdditionalMetadata("filename", filename) // 设置附加元数据
                            .build();
                }
                MarkdownDocumentReader reader = new MarkdownDocumentReader(resource, config);
                allDocuments.addAll(reader.get());
            }
        } catch (IOException e) {
            log.error("Markdown 文档加载失败", e);
        }
        return allDocuments;
    }

}
