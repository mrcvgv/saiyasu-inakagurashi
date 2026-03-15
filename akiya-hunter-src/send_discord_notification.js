const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatPrice(priceYen) {
  if (priceYen == null) return '不明';
  if (priceYen % 10000 === 0) return `${priceYen / 10000}万円`;
  return `${priceYen.toLocaleString('ja-JP')}円`;
}

function valueOrUnknown(value, suffix = '') {
  if (value == null || value === '') return '不明';
  return `${value}${suffix}`;
}

function summarizeChanges(changes) {
  if (!Array.isArray(changes) || changes.length === 0) return '詳細更新';

  const map = {
    notes: '備考欄変更',
    layout: '間取り更新',
    building_area_sqm: '建物面積更新',
    land_area_sqm: '土地面積更新',
    contact: '連絡先更新',
    status_text: 'ステータス更新',
    image_urls: '写真追加'
  };

  return changes.map((item) => map[item] || item).join(' / ');
}

function truncate(value, max = 1000) {
  if (!value) return null;
  const str = String(value).trim();
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

function formatEventMessage(event) {
  const property = event.property || {};
  const area = `${property.prefecture || '不明'} ${property.city || ''}`.trim();

  if (event.event_type === 'new') {
    return [
      '【新着空き家】',
      `エリア: ${area}`,
      `価格: ${formatPrice(property.price_yen)}`,
      `間取り: ${valueOrUnknown(property.layout)}`,
      `建物面積: ${valueOrUnknown(property.building_area_sqm, '㎡')}`,
      `土地面積: ${valueOrUnknown(property.land_area_sqm, '㎡')}`,
      `築年: ${valueOrUnknown(property.building_age, '年')}`,
      `住所: ${property.address_raw || '不明'}`,
      `備考: ${property.notes || 'なし'}`,
      '',
      property.url || ''
    ].join('\n');
  }

  if (event.event_type === 'price_down') {
    const oldPrice = event.matched_history ? event.matched_history.price_yen : null;
    return [
      '【値下げ空き家】',
      `エリア: ${area}`,
      `価格: ${formatPrice(oldPrice)} → ${formatPrice(property.price_yen)}`,
      `住所: ${property.address_raw || '不明'}`,
      `備考: ${property.notes || 'なし'}`,
      '',
      property.url || ''
    ].join('\n');
  }

  return [
    '【更新空き家】',
    `エリア: ${area}`,
    `価格: ${formatPrice(property.price_yen)}`,
    `住所: ${property.address_raw || '不明'}`,
    `更新内容: ${summarizeChanges(event.changes)}`,
    '',
    property.url || ''
  ].join('\n');
}

function buildDiscordPayload(event, username) {
  const property = event.property || {};
  const area = `${property.prefecture || '不明'} ${property.city || ''}`.trim();
  const titleMap = {
    new: '【新着空き家】',
    price_down: '【値下げ空き家】',
    updated: '【更新空き家】'
  };
  const colorMap = {
    new: 0x2ecc71,
    price_down: 0xe67e22,
    updated: 0x3498db
  };
  const fields = [
    { name: 'エリア', value: area || '不明', inline: true },
    { name: '価格', value: formatPrice(property.price_yen), inline: true },
    { name: '間取り', value: valueOrUnknown(property.layout), inline: true },
    { name: '建物面積', value: valueOrUnknown(property.building_area_sqm, '㎡'), inline: true },
    { name: '土地面積', value: valueOrUnknown(property.land_area_sqm, '㎡'), inline: true },
    { name: '築年', value: valueOrUnknown(property.building_age, '年'), inline: true },
    { name: '住所', value: truncate(property.address_raw || '不明', 1024), inline: false }
  ];

  if (event.event_type === 'price_down') {
    const oldPrice = event.matched_history ? event.matched_history.price_yen : null;
    fields[1] = { name: '価格', value: `${formatPrice(oldPrice)} → ${formatPrice(property.price_yen)}`, inline: true };
  }

  if (event.event_type === 'updated') {
    fields.push({ name: '更新内容', value: truncate(summarizeChanges(event.changes), 1024), inline: false });
  }

  if (property.status_text) {
    fields.push({ name: 'ステータス', value: truncate(property.status_text, 1024), inline: true });
  }

  if (property.inquiry_code) {
    fields.push({ name: '登録番号', value: String(property.inquiry_code), inline: true });
  }

  if (property.notes) {
    fields.push({ name: '備考', value: truncate(property.notes, 1024), inline: false });
  }

  const embeds = [
    {
      title: property.title ? truncate(property.title, 256) : titleMap[event.event_type] || '空き家通知',
      url: property.url || undefined,
      description: `${titleMap[event.event_type] || '空き家通知'}\n${property.url || ''}`.trim(),
      color: colorMap[event.event_type] || 0x95a5a6,
      fields,
      image: property.image_urls && property.image_urls[0] ? { url: property.image_urls[0] } : undefined
    }
  ];

  const extraImages = Array.isArray(property.image_urls) ? property.image_urls.slice(1, 4) : [];
  for (const imageUrl of extraImages) {
    embeds.push({ url: property.url || undefined, image: { url: imageUrl } });
  }

  return {
    username: username || '空き家ハンター びむ',
    content: formatEventMessage(event),
    embeds
  };
}

async function sendDiscordMessage(webhookUrl, payload) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.status}`);
  }
}

async function sendDiscordNotifications(events, options = {}) {
  const sent_notifications = [];
  const failed_notifications = [];

  for (const event of events) {
    if (!['new', 'price_down', 'updated'].includes(event.event_type)) {
      continue;
    }

    const payload = buildDiscordPayload(event, options.username);
    try {
      if (!options.dryRun) {
        await sendDiscordMessage(options.webhookUrl, payload);
      }
      sent_notifications.push({
        event_type: event.event_type,
        url: event.property?.url || null,
        sent_at: new Date().toISOString(),
        dry_run: Boolean(options.dryRun),
        content: payload.content,
        embeds: payload.embeds
      });
    } catch (error) {
      failed_notifications.push({
        event_type: event.event_type,
        url: event.property?.url || null,
        message: error.message
      });
    }
  }

  return { sent_notifications, failed_notifications };
}

function loadEvents(filePath) {
  const parsed = readJson(path.resolve(filePath));
  return Array.isArray(parsed.events) ? parsed.events : parsed;
}

function loadDiscordConfig() {
  const rootDir = path.resolve(__dirname, '..');
  const appConfigPath = fs.existsSync(path.join(rootDir, 'config', 'app.json'))
    ? path.join(rootDir, 'config', 'app.json')
    : path.join(rootDir, 'config', 'app.example.json');
  const appConfig = readJson(appConfigPath);
  return appConfig.discord;
}

async function main() {
  const fileArg = process.argv[2];
  const dryRun = process.argv.includes('--dry-run');
  if (!fileArg) {
    console.error('Usage: npm run notify:discord -- <events.json> [--dry-run]');
    process.exit(1);
  }

  const discord = loadDiscordConfig();
  const events = loadEvents(fileArg);
  const result = await sendDiscordNotifications(events, {
    webhookUrl: discord.webhook_url,
    username: discord.username,
    dryRun
  });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  sendDiscordNotifications,
  formatEventMessage,
  summarizeChanges,
  formatPrice,
  buildDiscordPayload
};
