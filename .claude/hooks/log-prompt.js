#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = (data.prompt || '').trim();
    if (!prompt) return;

    const cwd = data.cwd || process.cwd();
    const logPath = path.join(cwd, 'docs', 'prompt-log.md');
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    if (!fs.existsSync(logPath)) {
      fs.writeFileSync(
        logPath,
        '# Prompt Log\n\n' +
        'Bu dosya, Sucu projesinin geliştirilmesi sırasında Claude Code\'a gönderilen promptları kronolojik olarak kaydeder. AI destekli geliştirme sürecinin şeffaf dokümantasyonudur.\n\n' +
        '---\n\n'
      );
    }

    const now = new Date();
    const ts = now.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
    const entry = `## ${ts}\n\n${prompt}\n\n---\n\n`;
    fs.appendFileSync(logPath, entry);
  } catch (e) {
    // Hook'un prompt akışını bloklamaması için sessizce başarısız ol
  }
});
