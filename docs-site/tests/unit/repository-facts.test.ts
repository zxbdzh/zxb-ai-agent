import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '../../..');

async function source(relative: string): Promise<string> {
  return await readFile(path.join(repositoryRoot, relative), 'utf8');
}

test('conversation-memory guide claims remain mechanically tied to LoveApp source', async () => {
  const loveApp = await source('src/main/java/com/zxb/app/LoveApp.java');
  assert.match(loveApp, /MessageWindowChatMemory\.builder\(\)\.maxMessages\(3\)\.build\(\)/);
  assert.match(loveApp, /param\(CONVERSATION_ID, chatId\)/);
  assert.match(loveApp, /ChatMemory chatMemory/);
  assert.doesNotMatch(loveApp, /Jdbc|Redis/i);
});

test('console conversation uses one random ID per process and lives in test sources', async () => {
  const consoleSource = await source('src/test/java/com/zxb/zxbaiagent/ConsoleChatApplication.java');
  assert.match(consoleSource, /String chatId = UUID\.randomUUID\(\)\.toString\(\)/);
  assert.match(consoleSource, /loveApp\.doChat\(message, chatId\)/);
  assert.match(consoleSource, /"exit"\.equalsIgnoreCase\(message\)/);
  assert.match(consoleSource, /"quit"\.equalsIgnoreCase\(message\)/);
});

test('interactive external-model test remains enabled and assertion-free', async () => {
  const testSource = await source('src/test/java/com/zxb/zxbaiagent/ZxbAiAgentApplicationTests.java');
  assert.match(testSource, /@Test\s+\/\/ @Disabled\("Manual interactive test"\)\s+void testChat\(\)/s);
  assert.match(testSource, /new Scanner\(System\.in\)/);
  assert.match(testSource, /loveApp\.doChat\(message, chatId\)/);
  assert.doesNotMatch(testSource, /assert(?:Equals|True|False|That)\s*\(/);
});
