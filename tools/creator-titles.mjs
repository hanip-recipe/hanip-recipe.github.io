#!/usr/bin/env node
// 유명 유튜버 레시피 제목 앞에 이름 붙이기 (creators.mjs 목록 기준)
// 실행: node tools/creator-titles.mjs   (새 레시피를 넣은 뒤, seo.mjs 전에 한 번)
// recipes.json 과 r/<id>.json 의 제목을 함께 고친다. 여러 번 돌려도 결과가 같다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withCreator } from './creators.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const listFile = path.join(ROOT, 'recipes.json');
const list = JSON.parse(fs.readFileSync(listFile, 'utf8'));
let changed = 0;

for (const s of list) {
  const file = path.join(ROOT, 'r', `${s.id}.json`);
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  const channel = doc.video?.channel || s.channel || '';
  const title = withCreator(doc.recipe.title, channel);
  if (title !== doc.recipe.title) {
    doc.recipe.title = title;
    fs.writeFileSync(file, JSON.stringify(doc));
  }
  if (title !== s.title) { s.title = title; changed++; }
}
fs.writeFileSync(listFile, JSON.stringify(list));
console.log(`유튜버 이름을 붙인 제목: ${changed}개`);
