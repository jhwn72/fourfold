import { COMPARABLES, permitToCompletion } from "@/components/Comparables";
import OutcomeForm from "@/components/OutcomeForm";
import { learn } from "@/lib/learning";
import { loadOutcomes } from "./load";
import LearnPanels from "./LearnPanels";
import s from "./learn.module.css";

export const metadata = { title: "Project outcomes | FourFold" };
export const dynamic = "force-static";

export default async function LearnPage() {
  const real = await loadOutcomes();
  const all = await loadOutcomes({ includeExamples: true });
  const learnedReal = learn(real.records);
  // MADE UP: only for the labelled demo toggle.
  const learnedExample = learn(all.records.filter((r) => r.is_example));
  const apr = permitToCompletion(COMPARABLES.projects);

  return (
    <main className="container">
      <header className={s.head}>
        <span className="eyebrow">Continual learning · from real project outcomes</span>
        <h1>Project outcomes<span className="second">What FourFold has learned from projects that really happened.</span></h1>
        <p className={s.lede}>
          When an organization pursues a site, what really happened (dates, the city&apos;s answers, what FourFold got right
          or wrong, actual costs) goes into an outcome record. Code learns from the records: it adjusts checks the city
          has confirmed in writing, replaces assumed costs and timelines with real ones, and moves the questions that caught
          problems to the top of the call sheet. Claude only gets short text lessons for reading listings.
        </p>
      </header>

      <LearnPanels
        real={learnedReal}
        example={learnedExample}
        rejected={real.rejected.map((r) => ({ file: r.file.split("/").slice(-1)[0], errors: r.errors }))}
        apr={apr ? { medianMonths: apr.medianMonths, n: apr.n, source: COMPARABLES.source } : null}
      />

      <section className={s.section} id="record">
        <h2>Record an outcome</h2>
        <p className="muted">
          Builds a valid outcome record in your browser. Nothing is sent anywhere; a draft is saved in this browser only.
          Do not include personal information about tenants, buyers or residents. Describe facts, not people.
        </p>
        <OutcomeForm />
      </section>

      <p className={s.foot}>
        Prototype. Not legal, financial or lending advice; check with a professional before deciding. Format and rules:
        data/outcomes/README.md in the repo.
      </p>
    </main>
  );
}
