"use client";
import { useCallback, useEffect, useState } from "react";
import { EMPTY_PROFILE, type MeetingStatus, type OrgProfile as Profile, type OrgType, type YNU } from "@/lib/support";
import s from "./OrgProfile.module.css";

export const ORG_KEY = "fourfold-org";
const EVENT = "fourfold-org-change";

function read(): Profile | null {
  try {
    const raw = window.localStorage.getItem(ORG_KEY);
    if (!raw) return null;
    return { ...EMPTY_PROFILE, ...(JSON.parse(raw) as Partial<Profile>) };
  } catch {
    return null;
  }
}

/** Saved org profile from this browser. `loaded` is false until localStorage has been read. */
export function useOrgProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sync = () => setProfile(read());
    sync();
    setLoaded(true);
    window.addEventListener("storage", sync);
    window.addEventListener(EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVENT, sync);
    };
  }, []);

  const save = useCallback((p: Profile | null) => {
    try {
      if (p) window.localStorage.setItem(ORG_KEY, JSON.stringify({ ...p, updated: new Date().toISOString().slice(0, 10) }));
      else window.localStorage.removeItem(ORG_KEY);
    } catch {
      /* storage blocked: keep in memory only */
    }
    setProfile(p);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { profile, loaded, save };
}

function YnuField({ label, value, onChange }: { label: string; value: YNU; onChange: (v: YNU) => void }) {
  return (
    <div className={s.row}>
      <span className={s.q}>{label}</span>
      <div className="seg" role="radiogroup" aria-label={label}>
        {(["yes", "no", "unknown"] as YNU[]).map((v) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>
            {v === "unknown" ? "Not sure" : v === "yes" ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OrgProfile() {
  const { profile, loaded, save } = useOrgProfile();
  const [draft, setDraft] = useState<Profile>(EMPTY_PROFILE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loaded) setDraft(profile ?? EMPTY_PROFILE);
    // only on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setSaved(false);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save(draft);
    setSaved(true);
  };

  return (
    <form className={`card ${s.form}`} onSubmit={onSubmit}>
      <p className={`muted ${s.privacy}`}>
        Saved only in this browser (localStorage), never sent to a server. Describe your organization, not people: do not enter names, phone numbers, emails or other personal details.
      </p>

      <label className={s.field}>
        <span className={s.q}>Organization name</span>
        <input type="text" value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. your nonprofit's name" />
      </label>

      <div className={s.row}>
        <span className={s.q}>Type</span>
        <div className="seg" role="radiogroup" aria-label="Organization type">
          {([["nonprofit", "Nonprofit"], ["clt", "Community land trust"], ["other", "Other"]] as [OrgType, string][]).map(([v, t]) => (
            <button key={v} type="button" role="radio" aria-checked={draft.type === v} className={draft.type === v ? "on" : ""} onClick={() => set("type", v)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <label className={s.field}>
        <span className={s.q}>Cities where you already have projects or homes</span>
        <input type="text" value={draft.cities} onChange={(e) => set("cities", e.target.value)} placeholder="Comma separated, e.g. Santa Ana, Anaheim" />
      </label>

      <label className={s.field}>
        <span className={s.q}>Local partners (organizations only)</span>
        <textarea rows={2} value={draft.partners} onChange={(e) => set("partners", e.target.value)} placeholder="e.g. a congregation, a community development corporation" />
      </label>

      <YnuField label="Relationship with the city housing division" value={draft.housingDivision} onChange={(v) => set("housingDivision", v)} />
      <YnuField label="Relationship with city planning" value={draft.planning} onChange={(v) => set("planning", v)} />
      <YnuField label="Relationship with the council office" value={draft.councilOffice} onChange={(v) => set("councilOffice", v)} />

      <div className={s.row}>
        <span className={s.q}>Community meeting in the neighborhood</span>
        <div className="seg" role="radiogroup" aria-label="Community meeting">
          {([["held", "Held"], ["planned", "Planned"], ["no", "No"], ["unknown", "Not sure"]] as [MeetingStatus, string][]).map(([v, t]) => (
            <button key={v} type="button" role="radio" aria-checked={draft.communityMeeting === v} className={draft.communityMeeting === v ? "on" : ""} onClick={() => set("communityMeeting", v)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <YnuField label="Letters of support on file" value={draft.lettersOfSupport} onChange={(v) => set("lettersOfSupport", v)} />
      <YnuField label="Local funding committed" value={draft.localFunding} onChange={(v) => set("localFunding", v)} />
      {draft.localFunding === "yes" && (
        <label className={s.field}>
          <span className={s.q}>Amount committed (optional)</span>
          <input type="text" value={draft.localFundingAmount} onChange={(e) => set("localFundingAmount", e.target.value)} placeholder="As you would describe it" />
        </label>
      )}
      <YnuField label="Board members or volunteers live in the city" value={draft.boardInCity} onChange={(v) => set("boardInCity", v)} />

      <div className={s.actions}>
        <button type="submit">Save profile</button>
        {profile && (
          <button type="button" onClick={() => { save(null); setDraft(EMPTY_PROFILE); setSaved(false); }}>
            Clear
          </button>
        )}
        {saved && <span className="muted" role="status">Saved in this browser.</span>}
      </div>
    </form>
  );
}
