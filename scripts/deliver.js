#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { config as loadEnv } from 'dotenv';

const USER_DIR = join(homedir(), '.follow-science');
const CONFIG_PATH = join(USER_DIR, 'config.json');
const ENV_PATH = join(USER_DIR, '.env');

async function getDigestText() {
  const args = process.argv.slice(2);
  const msgIdx = args.indexOf('--message');
  if (msgIdx !== -1 && args[msgIdx + 1]) return args[msgIdx + 1];
  const fileIdx = args.indexOf('--file');
  if (fileIdx !== -1 && args[fileIdx + 1]) return readFile(args[fileIdx + 1], 'utf-8');
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

async function sendTelegram(text, botToken, chatId) {
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= 4000) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf('\n', 4000);
    if (splitAt < 2000) splitAt = 4000;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }

  for (const chunk of chunks) {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        disable_web_page_preview: true
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Telegram API error: ${err.description || res.statusText}`);
    }
  }
}

async function sendEmail(text, apiKey, toEmail) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: 'Research Signal Brief <digest@resend.dev>',
      to: [toEmail],
      subject: `Research Signal Brief — ${new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`,
      text
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Resend API error: ${err.message || JSON.stringify(err)}`);
  }
}

async function main() {
  loadEnv({ path: ENV_PATH });
  let config = {};
  if (existsSync(CONFIG_PATH)) config = JSON.parse(await readFile(CONFIG_PATH, 'utf-8'));
  const delivery = config.delivery || { method: 'stdout' };
  const digestText = await getDigestText();

  if (!digestText.trim()) {
    console.log(JSON.stringify({ status: 'skipped', reason: 'Empty digest text' }));
    return;
  }

  try {
    if (delivery.method === 'telegram') {
      if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN not found');
      if (!delivery.chatId) throw new Error('delivery.chatId not found');
      await sendTelegram(digestText, process.env.TELEGRAM_BOT_TOKEN, delivery.chatId);
      console.log(JSON.stringify({ status: 'ok', method: 'telegram' }));
    } else if (delivery.method === 'email') {
      if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not found');
      if (!delivery.email) throw new Error('delivery.email not found');
      await sendEmail(digestText, process.env.RESEND_API_KEY, delivery.email);
      console.log(JSON.stringify({ status: 'ok', method: 'email', message: `Digest sent to ${delivery.email}` }));
    } else {
      console.log(digestText);
    }
  } catch (err) {
    console.log(JSON.stringify({ status: 'error', method: delivery.method, message: err.message }));
    process.exit(1);
  }
}

main();
