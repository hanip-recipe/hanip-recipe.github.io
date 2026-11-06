// 이름으로 검색되는 유튜버 목록 (2026-11-06)
// 사람들이 «백종원 김치찌개 레시피»처럼 이름을 붙여 검색하므로, 이 채널의 레시피는 제목 앞에 이름을 붙인다.
// 채널 이름이 사람 이름이 아닌 곳(«이 남자의 cook» 등)은 넣지 않는다.
// 페이지에는 «한입레시피는 ○○ 측과 관계없는 개인 사이트» 안내를 함께 단다(seo.mjs).
export const CREATORS = [
  { match: '백종원', name: '백종원' },
  { match: '김대석', name: '김대석 셰프' },
  { match: '이연복', name: '이연복' },
  { match: '정호영', name: '정호영' },
  { match: '박막례', name: '박막례 할머니' },
];

export const creatorOf = (channel) => CREATORS.find((c) => (channel || '').includes(c.match))?.name || null;

// 제목 앞에 유튜버 이름을 붙인다. 이미 이름이 들어 있으면 그대로 둔다(여러 번 돌려도 같음).
export function withCreator(title, channel) {
  const name = creatorOf(channel);
  if (!name || !title) return title;
  return title.includes(name.split(' ')[0]) ? title : `${name} ${title}`;
}
