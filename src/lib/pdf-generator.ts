import type { Profile, Stat, Medal, Season, Achievement } from "@/lib/types";
import { MEASUREMENTS } from "@/lib/constants";

export interface PdfOptions {
  includeBasicInfo: boolean;
  includeSeasons: boolean;
  includeStats: boolean;
  includeSkillTags: boolean;
  includeMvp: boolean;
  includeAchievements: boolean;
  includeVideoQr: boolean;
}

export const DEFAULT_PDF_OPTIONS: PdfOptions = {
  includeBasicInfo: true,
  includeSeasons: true,
  includeStats: true,
  includeSkillTags: true,
  includeMvp: true,
  includeAchievements: true,
  includeVideoQr: true,
};

export async function generateProfilePdf(
  profile: Profile,
  stats: Stat[],
  medals: Medal[],
  seasons: Season[],
  achievements: Achievement[],
  options: PdfOptions
): Promise<Blob> {
  // Dynamic imports to reduce bundle size
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  // Create a hidden div for rendering
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 595px; min-height: 842px;
    background: #0C0C0E; color: #FAFAFA;
    font-family: 'Noto Sans KR', sans-serif;
    padding: 40px;
    box-sizing: border-box;
  `;

  let html = "";

  // Header
  html += `<div style="text-align:center;margin-bottom:24px;">
    <div style="font-family:'Rajdhani',sans-serif;font-size:24px;font-weight:700;color:#D4A853;letter-spacing:0.1em;">FOOTORY</div>
    <div style="font-size:10px;color:#71717A;margin-top:4px;">Youth Football Player Profile</div>
  </div>`;

  // Divider
  html += `<div style="height:2px;background:linear-gradient(135deg,#D4A853,#8B6914);margin-bottom:24px;border-radius:1px;"></div>`;

  // Basic Info
  if (options.includeBasicInfo) {
    const age = profile.birthYear ? new Date().getFullYear() - profile.birthYear : null;
    html += `<div style="display:flex;gap:16px;margin-bottom:24px;align-items:center;">
      <div style="width:80px;height:80px;border-radius:50%;background:#252528;border:3px solid #D4A853;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:28px;color:#71717A;flex-shrink:0;">
        ${profile.avatarUrl ? `<img src="${profile.avatarUrl}" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous" />` : profile.name[0]}
      </div>
      <div>
        <div style="font-size:22px;font-weight:700;">${profile.name}</div>
        <div style="font-size:13px;color:#A1A1AA;margin-top:2px;">
          ${[profile.position, age ? `${age}세` : null, profile.city].filter(Boolean).join(" · ")}
        </div>
        ${profile.teamName ? `<div style="font-size:13px;color:#D4A853;margin-top:2px;">${profile.teamName}</div>` : ""}
        <div style="font-size:11px;color:#71717A;margin-top:4px;">
          ${[
            profile.heightCm ? `${profile.heightCm}cm` : null,
            profile.weightKg ? `${profile.weightKg}kg` : null,
            profile.preferredFoot ? `${profile.preferredFoot}` : null,
          ].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>`;
  }

  // Stats
  if (options.includeStats && stats.length > 0) {
    html += `<div style="margin-bottom:20px;">
      <div style="font-size:10px;font-weight:700;color:#71717A;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">📊 측정 기록</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${stats.map((s) => {
          const m = MEASUREMENTS.find((m) => m.id === s.type);
          return `<div style="background:#161618;border-radius:8px;padding:10px 12px;">
            <div style="font-size:10px;color:#71717A;">${m?.icon ?? "📊"} ${m?.label ?? s.type}</div>
            <div style="font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;color:#FAFAFA;">${s.value}<span style="font-size:11px;font-weight:400;color:#A1A1AA;margin-left:2px;">${s.unit}</span></div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
  }

  // Seasons
  if (options.includeSeasons && seasons.length > 0) {
    html += `<div style="margin-bottom:20px;">
      <div style="font-size:10px;font-weight:700;color:#71717A;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">📅 시즌 기록</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="color:#71717A;border-bottom:1px solid #27272A;">
            <th style="text-align:left;padding:6px 8px;">연도</th>
            <th style="text-align:left;padding:6px 8px;">팀</th>
            <th style="text-align:left;padding:6px 8px;">포지션</th>
          </tr>
        </thead>
        <tbody>
          ${seasons.map((s) => `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
              <td style="padding:6px 8px;font-family:'Oswald',sans-serif;color:#D4A853;">${s.year}</td>
              <td style="padding:6px 8px;color:#FAFAFA;">${s.teamName}</td>
              <td style="padding:6px 8px;color:#A1A1AA;">${s.position}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>`;
  }

  // Medals
  if (medals.length > 0) {
    html += `<div style="margin-bottom:20px;">
      <div style="font-size:10px;font-weight:700;color:#71717A;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">🏅 메달</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${medals.map((m) => `
          <div style="background:rgba(212,168,83,0.08);border:1px solid rgba(212,168,83,0.2);border-radius:16px;padding:4px 10px;font-size:11px;color:#D4A853;">
            ${m.label}
          </div>
        `).join("")}
      </div>
    </div>`;
  }

  // MVP
  if (options.includeMvp && profile.mvpCount > 0) {
    html += `<div style="margin-bottom:20px;">
      <div style="font-size:10px;font-weight:700;color:#71717A;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">🏆 MVP</div>
      <div style="background:#161618;border-radius:8px;padding:10px 12px;">
        <span style="font-family:'Oswald',sans-serif;font-size:20px;font-weight:700;color:#D4A853;">${profile.mvpCount}</span>
        <span style="font-size:12px;color:#A1A1AA;margin-left:4px;">회 수상</span>
      </div>
    </div>`;
  }

  // Achievements
  if (options.includeAchievements && achievements.length > 0) {
    html += `<div style="margin-bottom:20px;">
      <div style="font-size:10px;font-weight:700;color:#71717A;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">🏅 수상/성과</div>
      ${achievements.map((a) => `
        <div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;">
          ${a.competition ? `<span style="color:#A1A1AA;">${a.year} ${a.competition} · </span>` : ""}
          <span style="color:#FAFAFA;font-weight:600;">${a.title}</span>
        </div>
      `).join("")}
    </div>`;
  }

  // Footer
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://footory.app";
  html += `<div style="margin-top:auto;padding-top:20px;border-top:1px solid #27272A;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:10px;color:#71717A;">${baseUrl}/p/${profile.handle}</div>
    <div style="font-size:10px;color:#71717A;">${new Date().toLocaleDateString("ko-KR")}</div>
  </div>`;

  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: "#0C0C0E",
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    return pdf.output("blob");
  } finally {
    document.body.removeChild(container);
  }
}
