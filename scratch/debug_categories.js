/**
 * Busca category_ids reales y prueba cargar streams de cada uno
 */

const username = 'FabianTorres04';
const password = 'S86te7zg6v';
const portal = 'http://poraquivamosentrando.vip:8080';

async function main() {
  console.log('Cargando categorías VOD...');
  const catRes = await fetch(`${portal}/player_api.php?username=${username}&password=${password}&action=get_vod_categories`);
  const cats = await catRes.json();
  console.log(`Total categorías: ${cats.length}`);
  console.log('Primeras 5:', cats.slice(0, 5).map(c => `${c.category_id}: ${c.category_name}`).join('\n  '));

  // Probar la primera categoría con streams
  const firstCat = cats[0];
  console.log(`\nProbando streams de categoría ${firstCat.category_id} (${firstCat.category_name})...`);
  const streamRes = await fetch(`${portal}/player_api.php?username=${username}&password=${password}&action=get_vod_streams&category_id=${firstCat.category_id}`);
  const streams = await streamRes.json();
  console.log(`Streams en categoria ${firstCat.category_id}: ${Array.isArray(streams) ? streams.length : JSON.stringify(streams)}`);

  // Y también sin category_id para ver si hay streams globales
  console.log('\nTotales sin filtro (primeros 3)...');
  const allRes = await fetch(`${portal}/player_api.php?username=${username}&password=${password}&action=get_vod_streams`);
  const allText = await allRes.text();
  try {
    const allData = JSON.parse(allText);
    console.log(`Total VOD streams (sin filtro): ${Array.isArray(allData) ? allData.length : 'no array'}`);
    if (Array.isArray(allData) && allData.length > 0) {
      console.log('Ejemplo:', JSON.stringify(allData[0]).substring(0, 200));
    }
  } catch {
    console.log('No JSON:', allText.substring(0, 200));
  }
}

main().catch(console.error);
