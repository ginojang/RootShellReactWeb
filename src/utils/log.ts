const TAGS = {
  rootShell: '[🌸RootShell]',
  unity: '[🎮RootShell-Unity]',
  firebase: '[🔥RootShell-Firebase]',
  wallet: '[👛RootShell-Wallet]',
};

const SYMBOLS = {
  success: '✅',
  warn: '⚠️',
  error: '❌',
};

// 현재 시각 (HH:MM:SS.mmm) 포맷 생성
function getTimeStamp(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

// 공통 출력 함수
function logWithTag(
  type: 'log' | 'warn' | 'error',
  symbol: string | null,
  message: string,
  scope: keyof typeof TAGS
) {
  const tag = TAGS[scope];
  const time = getTimeStamp();
  const prefix = `${tag} [${time}]`;
  const output = symbol ? `${prefix} ${symbol} ${message}` : `${prefix} ${message}`;

  console[type](output);
}

// 공개 API
export const log = (message: string, scope: keyof typeof TAGS = 'rootShell') =>
  logWithTag('log', null, message, scope);

export const logSuccess = (message: string, scope: keyof typeof TAGS = 'rootShell') =>
  logWithTag('log', SYMBOLS.success, message, scope);

export const logWarn = (message: string, scope: keyof typeof TAGS = 'rootShell') =>
  logWithTag('warn', SYMBOLS.warn, message, scope);

export const logError = (message: string, scope: keyof typeof TAGS = 'rootShell') =>
  logWithTag('error', SYMBOLS.error, message, scope);
