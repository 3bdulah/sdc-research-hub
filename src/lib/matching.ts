export type PollResponse = {
  id: string; name: string; email: string; axisRanking: string[]; trackPreference: "review" | "pair"; secondTrack: "review" | "pair"; sectors: string[];
  reading: number; translation: number; arabicWriting: number; technical: number; threadWriting: number; priorTranslation: boolean;
  weeklyHours: number; leadershipInterest: boolean; preferredPartner?: string; nonResponder?: boolean;
};

export type PairSuggestion = { id: string; axisId: string; memberIds: string[]; explanation: string; approved: boolean; override: boolean };
export type ReviewGroupSuggestion = { id: string; memberIds: string[]; headId: string; explanation: string };
export type MatchingResult = { pairs: PairSuggestion[]; reviewGroups: ReviewGroupSuggestion[]; warnings: string[] };

function score(member: PollResponse, axisId: string): number { return Math.max(0, 3 - member.axisRanking.indexOf(axisId)) * 4 + member.reading + member.translation + member.technical + (member.priorTranslation ? 3 : 0) + (member.leadershipInterest ? 1 : 0); }
function csvLine(line: string): string[] { const cells: string[] = []; let cell = ""; let quoted = false; for (const character of line) { if (character === '"') quoted = !quoted; else if (character === "," && !quoted) { cells.push(cell.trim()); cell = ""; } else cell += character; } cells.push(cell.trim()); return cells; }

export function parsePollCsv(csv: string): PollResponse[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim()); if (lines.length < 2) return [];
  const headers = csvLine(lines[0]).map((header) => header.toLowerCase());
  const required = ["id", "name", "email", "axisranking", "trackpreference", "sectors", "reading", "translation", "arabicwriting", "technical", "threadwriting", "priortranslation", "weeklyhours"];
  if (!required.every((header) => headers.includes(header))) throw new Error(`Poll CSV is missing required columns: ${required.filter((header) => !headers.includes(header)).join(", ")}`);
  return lines.slice(1).map((line) => { const values = Object.fromEntries(headers.map((header, index) => [header, csvLine(line)[index] ?? ""])); const axisRanking = values.axisranking.split(/[|;>]/).map((value) => value.trim()).filter(Boolean); return { id: values.id, name: values.name, email: values.email, axisRanking, trackPreference: values.trackpreference === "review" ? "review" : "pair", secondTrack: values.secondtrack === "review" ? "review" : "pair", sectors: values.sectors.split(/[|;]/).map((value) => value.trim()).filter(Boolean), reading: Number(values.reading), translation: Number(values.translation), arabicWriting: Number(values.arabicwriting), technical: Number(values.technical), threadWriting: Number(values.threadwriting), priorTranslation: ["true", "1", "yes"].includes(values.priortranslation.toLowerCase()), weeklyHours: Number(values.weeklyhours), leadershipInterest: ["true", "1", "yes"].includes(values.leadershipinterest?.toLowerCase()), preferredPartner: values.preferredpartner || undefined, nonResponder: false }; });
}

export function suggestMatching(members: PollResponse[]): MatchingResult {
  const warnings: string[] = []; const pairMembers = members.filter((member) => member.trackPreference === "pair" || member.secondTrack === "pair");
  if (pairMembers.length < 30) warnings.push(`يوجد ${pairMembers.length} مشاركاً لمسار الثنائيات؛ المطلوب 30.`);
  const pairs: PairSuggestion[] = []; const assigned = new Set<string>();
  for (const axisId of ["a1", "a2", "a3"]) {
    const candidates = pairMembers.filter((member) => !assigned.has(member.id)).sort((a, b) => score(b, axisId) - score(a, axisId) || a.id.localeCompare(b.id));
    const selected: PollResponse[] = [];
    while (selected.length < 10 && candidates.length) { const next = candidates.shift(); if (next) selected.push(next); }
    for (let index = 0; index < selected.length; index += 2) {
      let first = selected[index]; let second = selected[index + 1];
      if (!second) { warnings.push(`تعذر إكمال ثنائي في ${axisId}.`); break; }
      if (!first.priorTranslation && second.priorTranslation) [first, second] = [second, first];
      if (!first.priorTranslation && !second.priorTranslation) {
        const replacement = pairMembers.find((member) => !assigned.has(member.id) && member.priorTranslation && member.id !== first.id && member.id !== second.id);
        if (replacement) second = replacement;
        else warnings.push(`لا توجد خبرة ترجمة متاحة لضمانها في ${axisId}.`);
      }
      assigned.add(first.id); assigned.add(second.id);
      const partnerBonus = first.preferredPartner === second.id || second.preferredPartner === first.id;
      const fit = first.axisRanking[0] === axisId ? "اختيار أول" : "اختيار بديل";
      const experience = first.priorTranslation || second.priorTranslation ? "خبرة ترجمة موجودة" : "تحتاجان دعماً إضافياً";
      const partner = partnerBonus ? "؛ تفضيل الشريك تحقق كعامل ناعم" : "";
      pairs.push({ id: `pair-suggestion-${pairs.length + 1}`, axisId, memberIds: [first.id, second.id], explanation: `${fit} للمحور؛ ${experience}${partner}.`, approved: false, override: false });
    }
  }
  const reviewers = members.filter((member) => member.trackPreference === "review" || member.secondTrack === "review").sort((a, b) => (b.threadWriting + b.reading) - (a.threadWriting + a.reading) || a.id.localeCompare(b.id));
  const sizes = [5, 5, 4, 4]; const reviewGroups = sizes.map((size, index) => { const group = reviewers.splice(0, size); const head = group.slice().sort((a, b) => Number(b.leadershipInterest) - Number(a.leadershipInterest) || b.threadWriting - a.threadWriting)[0]; return { id: `review-group-${index + 1}`, memberIds: group.map((member) => member.id), headId: head?.id ?? "", explanation: head ? "رئيس المجموعة اختير من الاهتمام القيادي والقدرة على كتابة الخيوط." : "المجموعة تحتاج أعضاءً إضافيين." }; });
  if (reviewers.length) warnings.push(`${reviewers.length} مراجع لم يدخل مجموعة بسبب زيادة الاستجابات.`);
  return { pairs, reviewGroups, warnings };
}
