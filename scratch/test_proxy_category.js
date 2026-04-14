/**
 * Test del proxy Vercel + category_id
 * Uso: node scratch/test_proxy_category.js
 */

const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({ path: '.env.local' });

const BASE = 'https://ridertv.vercel.app/api/iptv/proxy';
const username = 'FabianTorres04';
const password = 'S86te7zg6v';
const portal_url = encodeURIComponent('http://poraquivamosentrando.vip:8080');

const TESTS = [
  { name: 'Categorías VOD (proxy)',   url: `${BASE}?username=${username}&password=${password}&portal_url=${portal_url}&action=get_vod_categories` },
  { name: 'Categorías Live (proxy)',  url: `${BASE}?username=${username}&password=${password}&portal_url=${portal_url}&action=get_live_categories` },
  { name: 'Categorías Series (proxy)', url: `${BASE}?username=${username}&password=${password}&portal_url=${portal_url}&action=get_series_categories` },
  { name: 'VOD streams cat=1 (proxy)', url: `${BASE}?username=${username}&password=${password}&portal_url=${portal_url}&action=get_vod_streams&category_id=1` },
];

async function test(name, url) {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const ms = Date.now() - start;
    const text = await res.text();
    if (!res.ok) {
      console.log(`  ✗ ${name}: HTTP ${res.status} en ${ms}ms → ${text.substring(0, 100)}`);
      return;
    }
    try {
      const data = JSON.parse(text);
      const count = Array.isArray(data) ? data.length : (data?.error || 'object');
      console.log(`  ${Array.isArray(data) && data.length > 0 ? '✅' : '⚠️'} ${name}: ${count} items en ${ms}ms`);
    } catch {
      console.log(`  ✗ ${name}: NO JSON en ${ms}ms → ${text.substring(0, 100)}`);
    }
  } catch (err) {
    const ms = Date.now() - start;
    console.log(`  ✗ ${name}: ${err.message} (${ms}ms)`);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('   TEST PROXY VERCEL → IPTV');
  console.log('═══════════════════════════════════════════\n');

  for (const t of TESTS) {
    await test(t.name, t.url);
  }

  console.log('\n═══════════════════════════════════════════\n');
}

main();
