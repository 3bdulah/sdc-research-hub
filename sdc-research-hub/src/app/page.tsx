import { LocaleSwitcher } from "@/components/locale-switcher";
import { RoleSwitcher } from "@/components/role-switcher";
import { PaperGateForm } from "@/components/paper-gate-form";
import { CycleBoard } from "@/components/cycle-board";
import { seedConfig } from "@/lib/config";
import { buildPaperBoard, generateCycleCalendar } from "@/lib/cycle";
import { demoCounts, demoPapers } from "@/lib/demo-data";
import { getAppMode } from "@/lib/mode";
import { listStoredPapers } from "@/lib/db/runtime";

export const dynamic = "force-dynamic";

const cards = [["الثنائيات البحثية", demoCounts.pairs], ["منسقو المحاور", demoCounts.coordinators], ["المراجعون", demoCounts.reviewers], ["الأبحاث هذا الشهر", demoCounts.papers]] as const;

export default function Home() {
  const mode = getAppMode();
  const calendar = generateCycleCalendar(seedConfig.plan.cycleStart);
  const storedPapers = listStoredPapers();
  const board = buildPaperBoard(storedPapers.length > 0 ? storedPapers : demoPapers, seedConfig.plan.cycleStart, new Date());
  const completeCount = board.filter((paper) => paper.complete).length;
  return <main className="min-h-screen">
    <header className="border-b border-ink/10 bg-white/80"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5"><div><p className="mb-1 text-sm font-medium text-teal">SDC · فريق البحث العلمي</p><h1 className="text-2xl font-bold">مركز أبحاث SDC</h1></div><div className="flex items-center gap-3"><LocaleSwitcher /><RoleSwitcher /></div></div></header>
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <section className="rounded-3xl bg-ink p-8 text-white shadow-xl"><div className="max-w-3xl"><span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/80">وضع {mode === "demo" ? "تجريبي آمن" : "خاص"}</span><h2 className="mt-5 text-4xl font-bold leading-tight">نحو معرفة عربية موثوقة، بحثًا بعد بحث.</h2><p className="mt-4 text-lg leading-8 text-white/70">لوحة الفريق الشهرية لإدارة الأبحاث، الترجمة، التلخيص، والمراجعة — في مكان واحد.</p></div></section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <article className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm" key={label}><p className="text-sm text-ink/60">{label}</p><p className="mt-2 text-4xl font-bold text-teal">{value}</p></article>)}</section>
      <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-ink/60">دورة نوفمبر 2026 · بداية قابلة للتعديل</p><h2 className="mt-1 text-2xl font-bold">لوحة الدورة</h2></div><div className="flex gap-2 text-sm"><span className="rounded-full bg-teal/10 px-3 py-1 text-teal">مكتمل: {completeCount}/15</span><span className="rounded-full bg-coral/10 px-3 py-1 text-coral">كل بحث = ملفان مستقلان</span></div></div><CycleBoard initialBoard={board} /></section>
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"><article className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm"><p className="text-sm text-ink/60">التقويم المحسوب</p><h2 className="mt-1 text-xl font-bold">مراحل الدورة</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{calendar.map((milestone) => <div className="rounded-xl bg-sand px-4 py-3" key={milestone.id}><div className="flex items-center justify-between gap-2"><p className="font-medium">اليوم {milestone.cycleDay}: {milestone.labelAr}</p><span className="font-mono text-xs" dir="ltr">{milestone.dueDate}</span></div>{milestone.shifted && <p className="mt-1 text-xs text-coral">{milestone.noticeAr}</p>}</div>)}</div></article><aside className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm"><p className="text-sm text-ink/60">ضبط الخطة</p><h2 className="mt-1 text-xl font-bold">مصدر الإعدادات</h2><p className="mt-4 leading-7 text-ink/70">كل المحاور، المؤشرات، المواضيع، والمسؤوليات محملة من ملفات إعداد قابلة للتحرير، وليست ثابتة داخل الواجهة.</p><div className="mt-5 space-y-2 text-sm"><p>المحاور: <strong>{seedConfig.axes.length}</strong></p><p>مؤشرات الأداء: <strong>{seedConfig.kpis.length}</strong></p><p>بداية الدورة: <strong>{seedConfig.plan.cycleStart}</strong></p><p>المخرجات: <strong>ترجمة مستقلة + ملخص مستقل</strong></p></div></aside></section>
      <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm"><p className="text-sm text-ink/60">بوابة البحث · M2</p><h2 className="mt-1 text-xl font-bold">تحقق من أهلية بحث جديد</h2><p className="mb-5 mt-3 text-sm leading-7 text-ink/65">الصق رابط arXiv أو DOI. يبدأ الفحص من OpenAlex ثم يستخدم arXiv كبديل، ولا يدخل البحث دورة الفريق دون verdict للرخصة.</p><PaperGateForm /></section>
    </div>
  </main>;
}
