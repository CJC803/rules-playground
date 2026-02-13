import "./style.css";
import { evaluate, type Context, type DayType, type Role } from "./rules";

function el<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing element with id="${id}"`);
  return found as T;
}

const ui = {
  role: el<HTMLSelectElement>("role"),
  center: el<HTMLInputElement>("center"),
  dayType: el<HTMLSelectElement>("dayType"),
  automationConnected: el<HTMLInputElement>("automationConnected"),

  taggedAnomaly: el<HTMLInputElement>("taggedAnomaly"),
  sodTagged: el<HTMLInputElement>("sodTagged"),
  weatherPlaybookReady: el<HTMLInputElement>("weatherPlaybookReady"),
  forceEnable: el<HTMLInputElement>("forceEnable"),
  writeAccess: el<HTMLInputElement>("writeAccess"),

  statusBadge: el<HTMLDivElement>("statusBadge"),
  reason: el<HTMLDivElement>("reason"),
  ruleId: el<HTMLDivElement>("ruleId"),
  jsonPreview: el<HTMLPreElement>("jsonPreview"),

  copyBtn: el<HTMLButtonElement>("copyBtn"),
  copyToast: el<HTMLDivElement>("copyToast"),
};

function readContext(): Context {
  return {
    role: ui.role.value as Role,
    center: ui.center.value.trim() || "—",
    dayType: ui.dayType.value as DayType,
    automationConnected: ui.automationConnected.checked,
    flags: {
      taggedAnomaly: ui.taggedAnomaly.checked,
      sodTagged: ui.sodTagged.checked,
      weatherPlaybookReady: ui.weatherPlaybookReady.checked,
      forceEnable: ui.forceEnable.checked,
      writeAccess: ui.writeAccess.checked,
    },
  };
}

function setBadge(enabled: boolean) {
  ui.statusBadge.textContent = enabled ? "ENABLED" : "DISABLED";
  ui.statusBadge.classList.toggle("enabled", enabled);
  ui.statusBadge.classList.toggle("disabled", !enabled);
}

function summary(ctx: Context, enabled: boolean, ruleId: string, reason: string) {
  const status = enabled ? "ENABLED" : "DISABLED";
  return `Decision: ${status} — ${ruleId} — ${reason} (Role=${ctx.role}, DayType=${ctx.dayType}, Center=${ctx.center}, AutomationConnected=${ctx.automationConnected})`;
}

function toast(msg: string) {
  ui.copyToast.textContent = msg;
  window.setTimeout(() => {
    if (ui.copyToast.textContent === msg) ui.copyToast.textContent = "";
  }, 1200);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older/locked-down environments
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function render() {
  const ctx = readContext();
  const decision = evaluate(ctx);

  setBadge(decision.enabled);
  ui.reason.textContent = decision.reason;
  ui.ruleId.textContent = decision.ruleId;
  ui.jsonPreview.textContent = JSON.stringify(ctx, null, 2);

  ui.copyBtn.onclick = async () => {
    const text = summary(ctx, decision.enabled, decision.ruleId, decision.reason);
    const ok = await copyText(text);
    toast(ok ? "Copied ✅" : "Copy failed (clipboard blocked).");
  };
}

function wire() {
  const inputs: Array<HTMLInputElement | HTMLSelectElement> = [
    ui.role,
    ui.center,
    ui.dayType,
    ui.automationConnected,
    ui.taggedAnomaly,
    ui.sodTagged,
    ui.weatherPlaybookReady,
    ui.forceEnable,
    ui.writeAccess,
  ];

  for (const input of inputs) {
    input.addEventListener("input", render);
    input.addEventListener("change", render);
  }
}

wire();
render();
