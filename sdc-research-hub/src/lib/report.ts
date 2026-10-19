import type { PaperBoardRow } from "@/lib/cycle";

export function generateMonthlyReport(month: string, papers: PaperBoardRow[]): string {
  const completed = papers.filter((paper) => paper.complete).length;
  const licensed = papers.filter((paper) => paper.license === "allowed").length;
  const byAxis = ["a1", "a2", "a3"].map((axis) => `- المحور ${axis.slice(1)}: ${papers.filter((paper) => paper.axis === axis && paper.complete).length} أبحاث مكتملة`).join("\n");
  return `# التقرير الشهري لفريق البحث العلمي — ${month}\n\n## الملخص التنفيذي\n\n- الأبحاث المكتملة: **${completed}/15**\n- الأبحاث برخصة مسموحة: **${licensed}/${papers.length}**\n- الثريدات: **4 مستهدف**\n- الملخص الشهري: **1 مستهدف**\n\n## التوزيع حسب المحور\n\n${byAxis}\n\n## بوابات الجودة\n\n- الترجمة الكاملة والملخص المستقل مطلوبان لكل بحث.\n- لا يُعتمد أي بحث دون verdict للرخصة.\n- الاعتماد النهائي يتطلب توقيع القائد والنائبة وفتح كل الروابط.\n\n## ملاحظات المتابعة\n\n- تُراجع الحالات المتأخرة مع منسق المحور ثم القائد والنائبة حسب مدة التأخر.\n- هذا التقرير مسودة جاهزة للمراجعة البشرية قبل الإرسال.\n\n**DRAFT (مسودة)**`;
}
