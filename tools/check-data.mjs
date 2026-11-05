#!/usr/bin/env node
// 한입레시피 데이터 검사 (의존성 없음). 실행: node tools/check-data.mjs
// recipes.json 목록과 r/<id>.json 상세가 서로 맞는지, 필드가 빠지지 않았는지 확인한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const LIST_FIELDS = ['id', 'title', 'cook_minutes', 'channel', 'thumbnail', 'views', 'created_at', 'ingredients', 'tags', 'servings', 'kcal', 'total_price'];
const ID = /^[A-Za-z0-9_-]{11}$/;

let list;
try { list = JSON.parse(fs.readFileSync(path.join(ROOT, 'recipes.json'), 'utf8')); } catch (e) { console.log('❌ recipes.json 파싱 실패:', e.message); process.exit(1); }
if (!Array.isArray(list)) err('recipes.json 이 배열이 아님');

const seen = new Set();
for (const [i, s] of list.entries()) {
  const at = `recipes.json[${i}] ${s.id}`;
  for (const k of LIST_FIELDS) if (!(k in s)) err(`${at}: ${k} 없음`);
  if (!ID.test(s.id || '')) err(`${at}: 유튜브 id 형식이 아님`);
  if (seen.has(s.id)) err(`${at}: id 중복`); seen.add(s.id);
  if (!s.title) err(`${at}: 제목이 비었음`);
  if (!Number.isInteger(s.views) || s.views <= 0) err(`${at}: views 값 이상 (${s.views})`);
  if (!/^https:\/\/i\.ytimg\.com\/vi(_webp)?\/[\w-]{11}\//.test(s.thumbnail || '') || !s.thumbnail.includes(s.id)) err(`${at}: thumbnail 주소 이상`);
  if (Number.isNaN(Date.parse(s.created_at))) err(`${at}: created_at 날짜 아님`);
  if (!Array.isArray(s.ingredients) || !s.ingredients.length) err(`${at}: ingredients 비었음`);
  if (!Array.isArray(s.tags) || !s.tags.length) err(`${at}: tags 비었음`);

  const f = path.join(ROOT, 'r', `${s.id}.json`);
  if (!fs.existsSync(f)) { err(`${at}: r/${s.id}.json 없음`); continue; }
  let d;
  try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { err(`r/${s.id}.json 파싱 실패: ${e.message}`); continue; }
  const x = d.recipe || {};
  if (d.id !== s.id || d.video?.id !== s.id) err(`r/${s.id}.json: id 불일치`);
  for (const k of ['title', 'channel', 'views', 'duration', 'thumbnail']) if (d.video?.[k] == null) err(`r/${s.id}.json: video.${k} 없음`);
  for (const k of ['title', 'summary', 'servings', 'cook_minutes', 'tools', 'ingredients', 'steps', 'tips', 'tags', 'nutrition_per_serving']) if (!(k in x)) err(`r/${s.id}.json: recipe.${k} 없음`);
  if (!x.ingredients?.length) err(`r/${s.id}.json: 재료 없음`);
  if (!x.steps?.length) warns.push(`r/${s.id}.json: 만드는 법 단계가 비어 있음 (페이지는 열리지만 순서가 안 보임)`);
  const names = new Set((x.ingredients || []).map((g) => g.name));
  for (const g of x.ingredients || []) {
    if (!g.name) err(`r/${s.id}.json: 이름 없는 재료`);
    if (!('qty' in g) || !('unit' in g) || !('price_krw' in g)) err(`r/${s.id}.json: 재료 ${g.name} 필드 누락`);
    if (!g.coupang_url) err(`r/${s.id}.json: 재료 ${g.name} 링크 없음`);
  }
  for (const [n, st] of (x.steps || []).entries()) {
    if (!st.text) err(`r/${s.id}.json: ${n + 1}단계 문장 없음`);
    for (const u of st.ingredients || []) if (!names.has(u)) err(`r/${s.id}.json: ${n + 1}단계 재료 '${u}' 가 재료 목록에 없음`);
  }
  // 목록과 상세가 같은 값을 가리키는지
  if (d.video?.views !== s.views) err(`${at}: views 가 상세와 다름`);
  if (d.video?.channel !== s.channel) err(`${at}: channel 이 상세와 다름`);
  if (x.title !== s.title) err(`${at}: title 이 상세와 다름`);
  if (JSON.stringify((x.ingredients || []).map((g) => g.name)) !== JSON.stringify(s.ingredients)) err(`${at}: ingredients 가 상세와 다름`);
  const sum = (x.ingredients || []).reduce((a, g) => a + (g.price_krw || 0), 0);
  if (sum !== s.total_price) err(`${at}: total_price(${s.total_price}) ≠ 재료 가격 합(${sum})`);
  if ((x.nutrition_per_serving?.kcal ?? null) !== s.kcal) err(`${at}: kcal 이 상세와 다름`);
}
// r 폴더에 목록에 없는 파일이 있는지
for (const f of fs.readdirSync(path.join(ROOT, 'r'))) if (f.endsWith('.json') && !seen.has(f.slice(0, -5))) err(`r/${f}: recipes.json 목록에 없음`);

console.log(`검사: 레시피 ${list.length}개, r 파일 ${fs.readdirSync(path.join(ROOT, 'r')).length}개`);
for (const w of warns) console.log('  ⚠️ ' + w);
if (errors.length) { console.log(`❌ 문제 ${errors.length}개`); for (const e of errors) console.log('  - ' + e); process.exit(1); }
console.log('✅ 문제 없음: 모든 id 에 r 파일이 있고 필드가 빠지지 않았음');
