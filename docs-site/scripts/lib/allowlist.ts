export const GUIDE_ALLOWLIST = {
  'setup#prerequisites': 'current/setup.md#前提',
  'setup#local-secrets': 'current/setup.md#本地秘密',
  'model-configuration#current-configuration': 'current/model-configuration.md#当前配置',
  'model-configuration#model-selection': 'current/model-configuration.md#模型选择',
  'running-the-application#main-application': 'current/running-the-application.md#主应用',
  'running-the-application#console-chat': 'current/running-the-application.md#命令行对话',
  'conversation-memory#memory': 'current/conversation-memory.md#对话记忆',
  'conversation-memory#lifecycle': 'current/conversation-memory.md#生命周期',
  'verification-and-troubleshooting#secret-free-checks': 'current/verification-and-troubleshooting.md#无密钥检查',
  'verification-and-troubleshooting#interactive-test': 'current/verification-and-troubleshooting.md#交互式外部模型测试',
  'verification-and-troubleshooting#common-problems': 'current/verification-and-troubleshooting.md#常见问题',
} as const;

export type GuideTarget = keyof typeof GUIDE_ALLOWLIST;

export const GUIDE_TARGETS = Object.keys(GUIDE_ALLOWLIST) as [GuideTarget, ...GuideTarget[]];

export function assertGuideTarget(value: string | undefined): GuideTarget | undefined {
  if (value === undefined) return undefined;
  if (!(value in GUIDE_ALLOWLIST)) throw new Error(`Learning-Guide target is not allowlisted: ${value}`);
  return value as GuideTarget;
}
