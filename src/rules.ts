export type Role = "General" | "Support" | "PPM";
export type DayType = "Normal" | "SOD" | "Holiday" | "Weather";

export type Flags = {
  taggedAnomaly: boolean;
  sodTagged: boolean;
  weatherPlaybookReady: boolean;
  forceEnable: boolean;
  writeAccess: boolean;
};

export type Context = {
  role: Role;
  center: string;
  dayType: DayType;
  automationConnected: boolean;
  flags: Flags;
};

export type Decision = {
  enabled: boolean;
  reason: string;
  ruleId: string;
};

export type Rule = {
  id: string;
  when: (ctx: Context) => boolean;
  decide: (ctx: Context) => Decision;
};

export const rules: Rule[] = [
  {
    id: "R001_AUTOMATION_DISCONNECTED",
    when: (ctx) => ctx.automationConnected === false,
    decide: () => ({
      enabled: false,
      reason: "Automation isn’t connected; calendar inputs won’t flow downstream.",
      ruleId: "R001_AUTOMATION_DISCONNECTED",
    }),
  },
  {
    id: "R002_UNTAGGED_ANOMALY_BLOCK",
    when: (ctx) => ctx.dayType !== "Normal" && ctx.flags.taggedAnomaly === false,
    decide: () => ({
      enabled: false,
      reason: "Anomalous day isn’t tagged; system treats it as normal and planning gets noisy.",
      ruleId: "R002_UNTAGGED_ANOMALY_BLOCK",
    }),
  },
  {
    id: "R003_PPM_OVERRIDE",
    when: (ctx) => ctx.role === "PPM" && ctx.flags.forceEnable === true,
    decide: () => ({
      enabled: true,
      reason: "PPM override enabled for controlled testing.",
      ruleId: "R003_PPM_OVERRIDE",
    }),
  },
  {
    id: "R004_SUPPORT_VIEW_ONLY",
    when: (ctx) => ctx.role === "Support" && ctx.flags.writeAccess === false,
    decide: () => ({
      enabled: false,
      reason: "Support is view-only without write access.",
      ruleId: "R004_SUPPORT_VIEW_ONLY",
    }),
  },
  {
    id: "R005_HOLIDAY_REQUIRES_SOD_TAG",
    when: (ctx) => ctx.dayType === "Holiday" && ctx.flags.sodTagged === false,
    decide: () => ({
      enabled: false,
      reason: "Holiday requires SOD tag to prevent baseline pollution.",
      ruleId: "R005_HOLIDAY_REQUIRES_SOD_TAG",
    }),
  },
  {
    id: "R006_WEATHER_LIMITED_ENABLE",
    when: (ctx) => ctx.dayType === "Weather" && ctx.flags.weatherPlaybookReady === true,
    decide: () => ({
      enabled: true,
      reason: "Weather playbook ready; allow automation with guardrails.",
      ruleId: "R006_WEATHER_LIMITED_ENABLE",
    }),
  },
  {
    id: "R999_DEFAULT",
    when: () => true,
    decide: () => ({
      enabled: true,
      reason: "No blocking conditions detected.",
      ruleId: "R999_DEFAULT",
    }),
  },
];

export function evaluate(ctx: Context, orderedRules: Rule[] = rules): Decision {
  for (const rule of orderedRules) {
    if (rule.when(ctx)) return rule.decide(ctx);
  }
  // Defensive fallback (should never hit because R999_DEFAULT matches)
  return { enabled: true, reason: "No blocking conditions detected.", ruleId: "R999_DEFAULT" };
}
