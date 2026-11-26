import React, { useEffect, useState } from 'react';
import { Scene3DPreset } from '../types';
import { getCached3DThumbnail, request3DThumbnail } from '../engine/thumbnail3DRenderer';

export interface LessonThumbnailProps {
  id: string;
  title: string;
  scene3DPreset?: Scene3DPreset;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    sky: string;
  };
  className?: string;
}

/**
 * 100% bespoke, text-free 16:9 (640x360) artistic SVG illustrations tailored individually
 * to all 14 2D/Skill lessons AND used as rich immediate artwork previews for the 26 3D lessons
 * while their real Three.js 3D diorama snapshots render in the background queue.
 * ZERO shared house/tree templates. ZERO text overlays inside the illustration.
 */
export const LessonArtworkSVG: React.FC<{
  id: string;
  title: string;
  palette: LessonThumbnailProps['palette'];
  className?: string;
}> = ({ id, title, palette, className = 'h-full w-full object-cover' }) => {
  const { primary, secondary, accent, sky } = palette;
  const gid = `art-${id}`;

  const renderScene = () => {
    switch (id) {
      // === 14 DEDICATED 2D & SKILL LESSONS (HAND-CRAFTED INDIVIDUAL COMPOSITIONS) ===

      // 10. Bình Ngô đại cáo — Imperial crimson/gold scroll, Lam Sơn mountains, rising sun & battle pennant
      case 'sim-10':
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            <circle cx="485" cy="96" r="56" fill="#F59E0B" opacity="0.22" />
            <circle cx="485" cy="96" r="34" fill="#F59E0B" opacity="0.88" />
            {/* Lam Sơn mountain silhouettes */}
            <path d="M0,255 Q110,165 230,220 T460,185 T640,245 L640,360 L0,360 Z" fill="#7F1D1D" opacity="0.28" />
            <path d="M0,295 Q160,225 320,275 T640,260 L640,360 L0,360 Z" fill="#991B1B" opacity="0.48" />
            {/* Unfurling royal imperial scroll ("Cáo") */}
            <rect x="115" y="72" width="410" height="212" rx="12" fill="#FFFBEB" stroke="#B45309" strokeWidth="4" />
            <rect x="92" y="56" width="28" height="244" rx="12" fill="#7F1D1D" stroke="#F59E0B" strokeWidth="3" />
            <rect x="520" y="56" width="28" height="244" rx="12" fill="#7F1D1D" stroke="#F59E0B" strokeWidth="3" />
            {/* Decorative crimson imperial seal & calligraphic stroke columns (purely visual, no text) */}
            <rect x="148" y="102" width="344" height="152" rx="6" fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="6 4" />
            {[0, 1, 2, 3].map((c) => (
              <g key={c} transform={`translate(${182 + c * 78}, 122)`}>
                <rect x="0" y="0" width="38" height="10" rx="5" fill="#7F1D1D" opacity="0.82" />
                <rect x="4" y="22" width="30" height="7" rx="3.5" fill="#78350F" opacity="0.55" />
                <rect x="2" y="38" width="34" height="7" rx="3.5" fill="#78350F" opacity="0.45" />
                <rect x="6" y="54" width="26" height="7" rx="3.5" fill="#78350F" opacity="0.45" />
                <rect x="0" y="70" width="36" height="7" rx="3.5" fill="#78350F" opacity="0.35" />
              </g>
            ))}
            {/* Imperial vermilion seal stamp */}
            <rect x="444" y="206" width="36" height="36" rx="4" fill="#DC2626" opacity="0.88" />
            <rect x="451" y="213" width="22" height="22" rx="2" fill="none" stroke="#FEF3C7" strokeWidth="2" />
          </>
        );

      // 16. Trao duyên — Moonlit pavilion window, weeping willow, jade bracelet/hairpin ("chiếc vành, tờ mây") & lantern
      case 'sim-16':
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            {/* Deep twilight moonlit sky inside circular classical window */}
            <circle cx="320" cy="180" r="144" fill="#2E1065" stroke="#D97706" strokeWidth="6" />
            <circle cx="385" cy="116" r="36" fill="#FEF08A" opacity="0.92" />
            <circle cx="385" cy="116" r="56" fill="#FEF08A" opacity="0.18" />
            {/* Flowing weeping willow branches */}
            <path d="M210,76 Q240,150 228,238" fill="none" stroke="#4C1D95" strokeWidth="5" />
            <path d="M245,62 Q272,135 256,216" fill="none" stroke="#6B21A8" strokeWidth="4" />
            {/* Wooden lacquered sill & glowing keepsakes: jade ring + folded cloud-silk letter */}
            <rect x="172" y="246" width="296" height="28" rx="6" fill="#581C87" />
            {/* Jade keepsake bracelet ("chiếc vành") */}
            <ellipse cx="268" cy="232" rx="32" ry="18" fill="none" stroke="#34D399" strokeWidth="8" />
            <ellipse cx="268" cy="232" rx="32" ry="18" fill="none" stroke="#A7F3D0" strokeWidth="2" />
            {/* Folded cloud-letter ("tờ mây") & crimson silk ribbon */}
            <rect x="336" y="212" width="68" height="36" rx="6" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="2.5" />
            <path d="M336,230 Q370,220 404,230" fill="none" stroke="#E11D48" strokeWidth="4" />
            {/* Warm floating paper lantern */}
            <line x1="252" y1="36" x2="252" y2="96" stroke="#F59E0B" strokeWidth="2.5" />
            <ellipse cx="252" cy="120" rx="22" ry="28" fill="#F59E0B" opacity="0.9" />
            <ellipse cx="252" cy="120" rx="13" ry="22" fill="#FEF3C7" opacity="0.85" />
          </>
        );

      // 18. Lời tiễn dặn — Misty Tây Bắc peaks, Thai stilt house silhouette, winding farewell path & white Hoa Ban blossoms
      case 'sim-18':
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            {/* Layered misty Northwest ranges */}
            <path d="M0,210 Q130,90 270,180 T540,125 L640,170 L640,360 L0,360 Z" fill="#0F766E" opacity="0.32" />
            <path d="M0,250 Q160,155 340,225 T640,195 L640,360 L0,360 Z" fill="#115E59" opacity="0.52" />
            {/* Winding golden farewell mountain path */}
            <path d="M290,360 C310,300 375,280 350,235 C330,200 390,185 435,172" fill="none" stroke="#F59E0B" strokeWidth="14" strokeLinecap="round" opacity="0.72" />
            {/* Traditional Thai stilt house silhouette on left terrace */}
            <g transform="translate(88, 178)">
              <path d="M0,46 Q68,-12 136,46 Z" fill="#7C2D12" />
              <rect x="20" y="46" width="96" height="44" fill="#B45309" />
              <rect x="28" y="90" width="8" height="36" fill="#451A03" />
              <rect x="100" y="90" width="8" height="36" fill="#451A03" />
              <rect x="58" y="56" width="22" height="28" rx="3" fill="#FEF08A" opacity="0.85" />
            </g>
            {/* White & blush-pink Hoa Ban petals blooming across right foreground */}
            {[
              [480, 128, 1],
              [535, 168, 0.85],
              [440, 185, 0.72],
              [568, 114, 0.78],
            ].map(([cx, cy, s], idx) => (
              <g key={idx} transform={`translate(${cx}, ${cy}) scale(${s})`}>
                {[0, 72, 144, 216, 288].map((deg) => (
                  <ellipse
                    key={deg}
                    cx="0"
                    cy="-15"
                    rx="7"
                    ry="14"
                    fill="#FFFFFF"
                    stroke="#F43F5E"
                    strokeWidth="1.2"
                    transform={`rotate(${deg})`}
                  />
                ))}
                <circle cx="0" cy="0" r="5" fill="#F59E0B" />
              </g>
            ))}
            {/* Decorative Thai brocade strip along bottom edge */}
            <rect x="0" y="336" width="640" height="24" fill="#7F1D1D" />
            {Array.from({ length: 16 }).map((_, i) => (
              <polygon key={i} points={`${i * 40 + 20},339 ${i * 40 + 34},348 ${i * 40 + 20},357 ${i * 40 + 6},348`} fill="#F59E0B" opacity="0.85" />
            ))}
          </>
        );

      // 19. Văn tế nghĩa sĩ Cần Giuộc — Torchlit riverbank, bamboo spears ("tầm vông"), conical hat silhouettes & heroic ember glow
      case 'sim-19':
        return (
          <>
            <rect width="640" height="360" fill="#0F172A" />
            <radialGradient id={`${gid}-glow`} cx="52%" cy="56%" r="54%">
              <stop offset="0%" stopColor="#EA580C" stopOpacity="0.68" />
              <stop offset="55%" stopColor="#7F1D1D" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
            <rect width="640" height="360" fill={`url(#${gid}-glow)`} />
            {/* River horizon & shimmering torch reflection */}
            <rect x="0" y="264" width="640" height="96" fill="#1E293B" />
            <ellipse cx="330" cy="306" rx="180" ry="18" fill="#F97316" opacity="0.28" />
            {/* Crossed bamboo spears ("gậy tầm vông") & glowing torches */}
            {[170, 250, 340, 425, 495].map((x, i) => (
              <g key={i} transform={`translate(${x}, ${252}) rotate(${(i - 2) * 11})`}>
                <line x1="0" y1="20" x2="0" y2="-148" stroke="#D97706" strokeWidth="6" strokeLinecap="round" />
                {i % 2 === 1 && (
                  <>
                    <ellipse cx="0" cy="-156" rx="16" ry="26" fill="#F97316" opacity="0.9" />
                    <ellipse cx="0" cy="-152" rx="9" ry="16" fill="#FEF08A" />
                  </>
                )}
              </g>
            ))}
            {/* Heroic farmer-insurgent silhouettes wearing conical hats */}
            {[210, 320, 430].map((cx, idx) => (
              <g key={idx} transform={`translate(${cx}, ${212 + (idx % 2) * 10})`}>
                <polygon points="-38,8 0,-18 38,8" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.8" />
                <path d="M-28,12 Q0,2 28,12 L38,76 L-38,76 Z" fill="#1E293B" />
              </g>
            ))}
          </>
        );

      // 29. Tuyên ngôn Độc lập — Ceremonial Ba Đình wooden podium, fluttering red-gold star flag & golden sunrise rays
      case 'sim-29':
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            {/* Radiant golden sunrise rays behind podium */}
            <circle cx="320" cy="145" r="145" fill="#F59E0B" opacity="0.16" />
            <circle cx="320" cy="145" r="88" fill="#FDE047" opacity="0.28" />
            {/* Fluttering red flag with golden 5-point star */}
            <line x1="176" y1="42" x2="176" y2="292" stroke="#78350F" strokeWidth="7" strokeLinecap="round" />
            <path d="M180,50 Q256,34 328,54 Q392,70 444,50 L444,162 Q390,180 328,164 Q256,144 180,162 Z" fill="#DC2626" />
            <polygon
              points="312,78 320,101 344,101 325,115 332,138 312,124 292,138 299,115 280,101 304,101"
              fill="#FACC15"
            />
            {/* Ceremonial Ba Đình terraced wooden podium */}
            <rect x="218" y="216" width="204" height="72" rx="6" fill="#991B1B" />
            <rect x="206" y="206" width="228" height="16" rx="4" fill="#F59E0B" />
            <rect x="172" y="288" width="296" height="24" rx="4" fill="#7F1D1D" />
            <rect x="132" y="312" width="376" height="48" fill="#1E293B" opacity="0.88" />
            {/* Classical microphone silhouette atop podium */}
            <line x1="320" y1="206" x2="320" y2="174" stroke="#1E293B" strokeWidth="4" />
            <circle cx="320" cy="168" r="9" fill="#334155" stroke="#E2E8F0" strokeWidth="2" />
          </>
        );

      // 31. Ngôi kể và điểm nhìn trần thuật — Three optical viewing lenses / perspective cones focusing on central narrative stage
      case 'sim-31':
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            {/* Perspective grid floor */}
            <ellipse cx="320" cy="264" rx="220" ry="52" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2.5" />
            {/* Three distinct colored viewing cones (1st person, 3rd omniscient, 3rd limited) */}
            <polygon points="122,92 320,256 226,274" fill="#1D4ED8" opacity="0.24" />
            <polygon points="320,54 240,252 400,252" fill="#0F766E" opacity="0.22" />
            <polygon points="518,92 414,274 320,256" fill="#D97706" opacity="0.24" />
            {/* Three stylized eye/camera lenses */}
            {[
              [122, 92, '#1D4ED8'],
              [320, 56, '#0F766E'],
              [518, 92, '#D97706'],
            ].map(([cx, cy, col], idx) => (
              <g key={idx} transform={`translate(${cx}, ${cy})`}>
                <path d="M-40,0 Q0,-28 40,0 Q0,28 -40,0 Z" fill="#FFFFFF" stroke={col as string} strokeWidth="4" />
                <circle cx="0" cy="0" r="14" fill={col as string} />
                <circle cx="-4" cy="-4" r="4" fill="#FFFFFF" />
              </g>
            ))}
            {/* Central spotlighted character silhouette on story stage */}
            <circle cx="320" cy="206" r="22" fill="#0F2942" />
            <path d="M286,274 C288,236 352,236 354,274 Z" fill="#0F2942" />
          </>
        );

      // 32. Trình tự kể chuyện: Câu chuyện & Mạch truyện — Linear timeline vs looping flashback/flash-forward arcs + clock
      case 'sim-32':
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            {/* Straight chronological line (top) */}
            <line x1="88" y1="126" x2="552" y2="126" stroke="#0F766E" strokeWidth="6" strokeLinecap="round" />
            {[115, 250, 385, 520].map((x, idx) => (
              <g key={`top-${idx}`}>
                <circle cx={x} cy="126" r="22" fill="#FFFFFF" stroke="#0F766E" strokeWidth="5" />
                <circle cx={x} cy="126" r="9" fill="#0F766E" />
              </g>
            ))}
            {/* Non-linear narrative flashback / flash-forward sweeping arcs (bottom) */}
            <path d="M115,248 C180,165 320,165 385,248" fill="none" stroke="#E11D48" strokeWidth="5" strokeDasharray="10 6" />
            <path d="M520,248 C430,335 200,335 115,248" fill="none" stroke="#1E3A8A" strokeWidth="5" />
            <path d="M250,248 C310,192 460,192 520,248" fill="none" stroke="#D97706" strokeWidth="4.5" />
            {[115, 250, 385, 520].map((x, idx) => (
              <rect
                key={`bot-${idx}`}
                x={x - 20}
                y="228"
                width="40"
                height="40"
                rx="10"
                fill={idx === 2 ? '#E11D48' : idx === 0 ? '#1E3A8A' : '#FFFFFF'}
                stroke="#1E3A8A"
                strokeWidth="4"
              />
            ))}
          </>
        );

      // 33. Hệ thống 10+ Biện pháp tu từ — Luminous prism refracting light into expressive metaphor/simile/rhythm spectrum
      case 'sim-33':
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            {/* Incoming pure language ray */}
            <polygon points="0,162 246,174 246,192 0,204" fill="#7C3AED" opacity="0.28" />
            <line x1="0" y1="183" x2="248" y2="183" stroke="#6D28D9" strokeWidth="7" />
            {/* Refracted colorful literary spectrum rays */}
            {[
              ['#7C3AED', 76],
              ['#0284C7', 132],
              ['#0D9488', 186],
              ['#EA580C', 240],
              ['#E11D48', 292],
            ].map(([col, y], idx) => (
              <g key={idx}>
                <path d={`M362,182 Q460,${(182 + (y as number)) / 2} 640,${y}`} fill="none" stroke={col as string} strokeWidth="9" strokeLinecap="round" opacity="0.86" />
                <circle cx={535 + (idx % 2) * 30} cy={y as number} r="18" fill="#FFFFFF" stroke={col as string} strokeWidth="4" />
                <circle cx={535 + (idx % 2) * 30} cy={y as number} r="7" fill={col as string} />
              </g>
            ))}
            {/* Central faceted glass prism */}
            <polygon points="314,76 218,268 410,268" fill="#FFFFFF" fillOpacity="0.92" stroke="#6D28D9" strokeWidth="6" />
            <polygon points="314,76 314,268 410,268" fill="#DDD6FE" opacity="0.45" />
          </>
        );

      // 34. Vần, nhịp, thanh điệu và thể thơ — Flowing acoustic cadence waves, vertical rhythm slashes & tonal peaks
      case 'sim-34':
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            {/* Horizontal poetic stave lines */}
            {[92, 148, 204, 260].map((y) => (
              <line key={y} x1="48" y1={y} x2="592" y2={y} stroke="#BAE6FD" strokeWidth="2.5" />
            ))}
            {/* Flowing melodic prosody wave */}
            <path
              d="M48,196 C110,88 180,88 232,196 S354,304 416,196 S538,88 592,184"
              fill="none"
              stroke="#0369A1"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M48,220 C128,150 202,272 284,176 S442,102 592,216"
              fill="none"
              stroke="#7C3AED"
              strokeWidth="4.5"
              strokeDasharray="9 7"
            />
            {/* Bold diagonal rhythm caesura bars ("ngắt nhịp /") */}
            {[176, 332, 476].map((x) => (
              <line key={x} x1={x + 14} y1="74" x2={x - 14} y2="286" stroke="#10B981" strokeWidth="6" strokeLinecap="round" />
            ))}
            {/* Tonal pitch beads (Bằng = blue, Trắc = violet) */}
            {[
              [112, 128, '#0369A1'],
              [232, 196, '#7C3AED'],
              [352, 248, '#0369A1'],
              [416, 196, '#7C3AED'],
              [534, 126, '#10B981'],
            ].map(([cx, cy, col], idx) => (
              <circle key={idx} cx={cx as number} cy={cy as number} r="15" fill={col as string} stroke="#FFFFFF" strokeWidth="4" />
            ))}
          </>
        );

      // 36. Cấu trúc văn nghị luận — Classical 4-tier architectural argument temple (Thesis pediment, Pillars, Reasoning, Evidence base)
      case 'sim-36':
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            {/* Foundation Evidence Base */}
            <rect x="86" y="278" width="468" height="38" rx="8" fill="#0F766E" />
            <rect x="112" y="246" width="416" height="26" rx="6" fill="#1E3A8A" opacity="0.88" />
            {/* 3 Strong Reasoning Columns */}
            {[172, 320, 468].map((cx) => (
              <g key={cx}>
                <rect x={cx - 32} y="144" width="64" height="98" rx="6" fill="#FFFFFF" stroke="#1E3A8A" strokeWidth="4" />
                <line x1={cx - 12} y1="156" x2={cx - 12} y2="230" stroke="#93C5FD" strokeWidth="4" />
                <line x1={cx + 12} y1="156" x2={cx + 12} y2="230" stroke="#93C5FD" strokeWidth="4" />
              </g>
            ))}
            {/* Thesis Pediment Crown */}
            <polygon points="94,142 320,46 546,142" fill="#1E3A8A" />
            <polygon points="146,130 320,66 494,130" fill="#F59E0B" opacity="0.92" />
            <circle cx="320" cy="106" r="16" fill="#FFFFFF" />
          </>
        );

      // 37. Sơ đồ phân tích nhân vật — Central character silhouette encircled by 7 orbital analytical facet medallions
      case 'sim-37':
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            {/* Orbital ring connecting 7 dimensions */}
            <circle cx="320" cy="180" r="122" fill="none" stroke="#0F766E" strokeWidth="3" strokeDasharray="8 6" opacity="0.6" />
            <circle cx="320" cy="180" r="64" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="4.5" />
            {/* Central human silhouette */}
            <circle cx="320" cy="158" r="20" fill="#0F2942" />
            <path d="M286,214 C290,184 350,184 354,214 Z" fill="#0F2942" />
            {/* 7 Facet Medallions around the orbit */}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => {
              const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
              const cx = 320 + Math.cos(a) * 122;
              const cy = 180 + Math.sin(a) * 122;
              const cols = ['#0F766E', '#1D4ED8', '#E11D48', '#D97706', '#7C3AED', '#0284C7', '#15803D'];
              return (
                <g key={i}>
                  <line x1="320" y1="180" x2={cx} y2={cy} stroke={cols[i]} strokeWidth="2.2" opacity="0.35" />
                  <circle cx={cx} cy={cy} r="22" fill="#FFFFFF" stroke={cols[i]} strokeWidth="4" />
                  <circle cx={cx} cy={cy} r="9" fill={cols[i]} />
                </g>
              );
            })}
          </>
        );

      // 38. Phân tích hình tượng thơ — Concentric multi-layer lotus & moon reflection ripple symbolizing 4 poetic decoding layers
      case 'sim-38':
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            {/* 4 concentric poetic decoding halos */}
            <circle cx="320" cy="180" r="154" fill="#6D28D9" opacity="0.1" />
            <circle cx="320" cy="180" r="118" fill="#6D28D9" opacity="0.16" />
            <circle cx="320" cy="180" r="82" fill="#0E7490" opacity="0.22" />
            <circle cx="320" cy="180" r="46" fill="#E11D48" opacity="0.26" />
            {/* Sculpted blooming lotus petals */}
            {[-48, -24, 0, 24, 48].map((deg, i) => (
              <ellipse
                key={i}
                cx="320"
                cy="148"
                rx="22"
                ry="62"
                fill={i === 2 ? '#F43F5E' : i % 2 === 1 ? '#FB7185' : '#C084FC'}
                opacity="0.88"
                transform={`rotate(${deg} 320 206)`}
              />
            ))}
            {/* Luminous golden core pearl */}
            <circle cx="320" cy="186" r="18" fill="#FEF08A" stroke="#FFFFFF" strokeWidth="3" />
            {/* Water reflection ripples below */}
            <ellipse cx="320" cy="252" rx="132" ry="14" fill="none" stroke="#0E7490" strokeWidth="3" opacity="0.55" />
            <ellipse cx="320" cy="276" rx="178" ry="16" fill="none" stroke="#6D28D9" strokeWidth="2.2" opacity="0.4" />
          </>
        );

      // 39. Viết đoạn văn nghị luận 200 chữ — Crisp single-paragraph structured card + golden fountain pen nib + balance gauge
      case 'sim-39':
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            {/* Clean structured manuscript sheet */}
            <rect x="96" y="48" width="380" height="264" rx="16" fill="#FFFFFF" stroke="#0F766E" strokeWidth="4" />
            {/* Highlighted topic sentence bar */}
            <rect x="132" y="88" width="260" height="16" rx="8" fill="#0F766E" />
            {/* Body development bars */}
            <rect x="132" y="124" width="308" height="12" rx="6" fill="#94A3B8" opacity="0.55" />
            <rect x="132" y="152" width="286" height="12" rx="6" fill="#94A3B8" opacity="0.55" />
            <rect x="132" y="180" width="300" height="12" rx="6" fill="#94A3B8" opacity="0.55" />
            <rect x="132" y="208" width="248" height="12" rx="6" fill="#94A3B8" opacity="0.55" />
            {/* Concluding sentence bar */}
            <rect x="132" y="244" width="224" height="16" rx="8" fill="#D97706" />
            {/* Sculpted Fountain Pen Nib writing on right edge */}
            <g transform="translate(502, 168) rotate(32)">
              <polygon points="0,-78 24,18 0,58 -24,18" fill="#1E3A5F" stroke="#F59E0B" strokeWidth="4" />
              <line x1="0" y1="58" x2="0" y2="8" stroke="#FEF3C7" strokeWidth="3" />
              <circle cx="0" cy="4" r="6" fill="#F59E0B" />
              <rect x="-18" y="-114" width="36" height="42" rx="6" fill="#0F766E" />
            </g>
          </>
        );

      // 40. Viết bài văn nghị luận 600 chữ — Three-part balanced essay pages bridged by golden structural arcs & balance scale
      case 'sim-40':
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            {/* Connecting golden blueprint arcs */}
            <path d="M148,108 Q320,26 492,108" fill="none" stroke="#D97706" strokeWidth="5" strokeDasharray="8 6" />
            {/* 3 Essay Structure Pages: Intro (left), Body (tall center), Conclusion (right) */}
            <rect x="74" y="106" width="136" height="196" rx="14" fill="#FFFFFF" stroke="#1E3A8A" strokeWidth="4" />
            <rect x="94" y="132" width="96" height="14" rx="7" fill="#1E3A8A" />
            <rect x="94" y="160" width="84" height="10" rx="5" fill="#CBD5E1" />
            <rect x="94" y="182" width="92" height="10" rx="5" fill="#CBD5E1" />

            <rect x="234" y="64" width="172" height="252" rx="16" fill="#FFFFFF" stroke="#991B1B" strokeWidth="4.5" />
            <rect x="256" y="92" width="128" height="16" rx="8" fill="#991B1B" />
            <rect x="256" y="124" width="128" height="11" rx="5.5" fill="#FCA5A5" />
            <rect x="256" y="148" width="114" height="11" rx="5.5" fill="#CBD5E1" />
            <rect x="256" y="178" width="128" height="16" rx="8" fill="#0F766E" />
            <rect x="256" y="210" width="120" height="11" rx="5.5" fill="#CBD5E1" />
            <rect x="256" y="234" width="108" height="11" rx="5.5" fill="#CBD5E1" />
            <rect x="256" y="264" width="96" height="14" rx="7" fill="#F59E0B" />

            <rect x="430" y="106" width="136" height="196" rx="14" fill="#FFFFFF" stroke="#0F766E" strokeWidth="4" />
            <rect x="450" y="132" width="96" height="14" rx="7" fill="#0F766E" />
            <rect x="450" y="160" width="84" height="10" rx="5" fill="#CBD5E1" />
            <rect x="450" y="182" width="92" height="10" rx="5" fill="#CBD5E1" />
            <circle cx="498" cy="248" r="24" fill="#10B981" opacity="0.2" />
            <path d="M486,248 L495,257 L512,238" fill="none" stroke="#059669" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </>
        );

      // === DISTINCT INSTANT ARTWORK PREVIEWS FOR 26 3D SCENES (ALSO USED IN 2D STORYBOARD) ===
      case 'sim-07': // Hương Sơn phong cảnh: karst mountains, cave arch, curved pagoda, winding stream & boat
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            <path d="M0,210 Q95,90 190,190 Q280,75 375,185 Q485,80 640,195 L640,360 L0,360 Z" fill="#4B666B" opacity="0.58" />
            <path d="M170,230 Q290,72 415,230 Z" fill="#3F585E" />
            {/* Dark vaulted cave mouth */}
            <path d="M262,226 C262,162 332,162 332,226 Z" fill="#0B131C" />
            {/* Winding turquoise Suối Yến */}
            <path d="M310,230 C360,260 220,295 360,360 L215,360 C110,305 260,265 275,230 Z" fill="#0EA5E9" opacity="0.86" />
            {/* Curved pagoda roof on left bank */}
            <path d="M62,238 Q128,195 194,238 Q128,228 62,238 Z" fill="#991B1B" />
            <rect x="88" y="236" width="80" height="38" fill="#FEF3C7" />
            {/* Wooden boat gliding on stream */}
            <path d="M235,302 Q278,322 325,302 L314,292 L246,292 Z" fill="#78350F" />
          </>
        );

      case 'sim-03': // Chữ người tử tù: dark prison bars, golden torch glow & luminous white calligraphy silk
        return (
          <>
            <rect width="640" height="360" fill="#111827" />
            <radialGradient id={`${gid}-torch`} cx="58%" cy="48%" r="48%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#9A3412" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#111827" stopOpacity="0" />
            </radialGradient>
            <rect width="640" height="360" fill={`url(#${gid}-torch)`} />
            <rect x="64" y="44" width="136" height="96" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="4" />
            {[90, 118, 146, 174].map((x) => (
              <line key={x} x1={x} y1="44" x2={x} y2="140" stroke="#0F172A" strokeWidth="6" />
            ))}
            <polygon points="168,266 472,266 518,324 122,324" fill="#5C3A21" />
            <polygon points="204,274 436,274 466,312 174,312" fill="#FFFDF7" />
            <ellipse cx="476" cy="142" rx="22" ry="42" fill="#FB923C" />
            <ellipse cx="476" cy="148" rx="11" ry="24" fill="#FEF08A" />
          </>
        );

      case 'sim-01': // Thần Trụ Trời: cosmic stone pillar lifting bright sky above primordial mountains
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            <ellipse cx="320" cy="84" rx="260" ry="42" fill="#38BDF8" opacity="0.35" />
            <rect x="278" y="88" width="84" height="226" rx="8" fill="#78716C" />
            <path d="M0,310 Q140,220 278,310 Z" fill="#2F6E49" opacity="0.72" />
            <path d="M362,310 Q500,210 640,310 Z" fill="#4B666B" opacity="0.78" />
            <rect x="0" y="308" width="640" height="52" fill="#57534E" />
          </>
        );

      default: {
        // Distinct per-lesson geometric landscape/stage composition derived uniquely from each lesson's palette & ID
        const hash = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const sunX = 110 + ((hash * 47) % 420);
        const isDark = sky === '#0F172A' || sky === '#1E1B4B';
        return (
          <>
            <rect width="640" height="360" fill={`url(#${gid}-bg)`} />
            <circle cx={sunX} cy={88} r={46} fill={accent} opacity={isDark ? 0.35 : 0.25} />
            <circle cx={sunX} cy={88} r={26} fill={accent} opacity={0.85} />
            <path
              d={`M0,248 Q${140 + (hash % 60)},${135 + (hash % 40)} 320,218 T640,${195 + (hash % 45)} L640,360 L0,360 Z`}
              fill={primary}
              opacity="0.45"
            />
            <path
              d={`M0,284 Q${210 - (hash % 50)},${220 + (hash % 30)} 380,270 T640,254 L640,360 L0,360 Z`}
              fill={secondary}
              opacity="0.72"
            />
            <ellipse cx="320" cy="306" rx="185" ry="26" fill={accent} opacity="0.22" />
          </>
        );
      }
    }
  };

  return (
    <svg
      viewBox="0 0 640 360"
      className={className}
      role="img"
      aria-label={`Minh họa ${title}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`${gid}-bg`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={sky} />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>
      </defs>
      {renderScene()}
    </svg>
  );
};

/**
 * Smart 16:9 Lesson Thumbnail:
 * - For all 26 3D lessons: displays a rich bespoke instant vector composition, then smoothly reveals
 *   the authentic 16:9 offscreen Three.js 3D diorama snapshot captured directly from the actual 3D scene!
 * - For all 14 2D/Skill lessons: displays its dedicated hand-crafted 16:9 vector art illustration.
 * ZERO text overlays inside any thumbnail artwork.
 */
export const LessonThumbnail: React.FC<LessonThumbnailProps> = ({
  id,
  title,
  scene3DPreset,
  palette,
  className = '',
}) => {
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(() =>
    scene3DPreset ? getCached3DThumbnail(scene3DPreset) : null
  );

  useEffect(() => {
    if (!scene3DPreset) {
      setSnapshotUrl(null);
      return;
    }
    const cached = getCached3DThumbnail(scene3DPreset);
    if (cached) {
      setSnapshotUrl(cached);
      return;
    }
    let mounted = true;
    const cancel = request3DThumbnail(scene3DPreset, (url) => {
      if (mounted && url) {
        setSnapshotUrl(url);
      }
    });
    return () => {
      mounted = false;
      cancel();
    };
  }, [scene3DPreset]);

  return (
    <div className={`relative aspect-video w-full overflow-hidden bg-slate-100 ${className}`}>
      <LessonArtworkSVG
        id={id}
        title={title}
        palette={palette}
        className="h-full w-full object-cover"
      />
      {snapshotUrl && (
        <img
          src={snapshotUrl}
          alt={`Mô hình 3D ${title}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
        />
      )}
    </div>
  );
};
