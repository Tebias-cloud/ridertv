/**
 * Test completo del proxy IPTV
 * Uso: node scratch/test_iptv.js
 */

const dotenv = require('dotenv');
const fs = require('fs');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));

// Credenciales IPTV reales
const username = 'FabianTorres04';
const password = 'S86te7zg6v';
const portal_url = 'http://poraquivamosentrando.vip:8080';

const TESTS = [
  { name: 'Categorías VOD',   action: 'get_vod_categories' },
  { name: 'Categorías Live',  action: 'get_live_categories' },
  { name: 'Categorías Series', action: 'get_series_categories' },
  { name: '1 VOD stream',     action: 'get_vod_streams', extra: '&category_id=1' },
];

async function test(name, url) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'IPTVSmartersPlayer/3.0.0 (iPad; iOS 15.1; Scale/2.00)',
        'Accept': '*/*',
      },
      signal: AbortSignal.timeout(10000)
    });
    const ms = Date.now() - start;
    if (!res.ok) {
      console.log(`  ✗ ${name}: HTTP ${res.status} (${ms}ms)`);
      return false;
    }
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      const count = Array.isArray(data) ? data.length : 'object';
      console.log(`  ✅ ${name}: ${count} items en ${ms}ms`);
      return true;
    } catch {
      console.log(`  ✗ ${name}: Respuesta no es JSON (${ms}ms) → ${text.substring(0, 60)}`);
      return false;
    }
  } catch (err) {
    const ms = Date.now() - start;
    console.log(`  ✗ ${name}: ${err.message} (${ms}ms)`);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('   DIAGNÓSTICO IPTV DIRECTO');
  console.log(`   Portal: ${portal_url}`);
  console.log(`   User:   ${username}`);
  console.log('═══════════════════════════════════════\n');

  let allOk = true;
  for (const t of TESTS) {
    const url = `${portal_url}/player_api.php?username=${username}&password=${password}&action=${t.action}${t.extra || ''}`;
    const ok = await test(t.name, url);
    if (!ok) allOk = false;
  }

  console.log('\n═══════════════════════════════════════');
  if (allOk) {
    console.log('   ✅ IPTV FUNCIONA — Problema puede ser en el proxy Vercel');
  } else {
    console.log('   ✗ IPTV FALLA DIRECTAMENTE — Proveedor caído o credenciales incorrectas');
  }
  console.log('═══════════════════════════════════════\n');
}

main();
