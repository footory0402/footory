import { useState, useRef, useCallback } from "react";

const POSITIONS = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST", "CF"];
const CLUBS = [
  { name: "FC Seoul U12", color: "#C0392B", accent: "#E74C3C" },
  { name: "Jeonbuk U12", color: "#2E7D32", accent: "#4CAF50" },
  { name: "Ulsan U12", color: "#1565C0", accent: "#42A5F5" },
  { name: "Suwon U12", color: "#1565C0", accent: "#E53935" },
  { name: "Incheon U12", color: "#0D47A1", accent: "#1976D2" },
  { name: "직접 입력", color: "#37474F", accent: "#78909C" },
];

const TEMPLATES = [
  { id: "fifa", name: "FIFA 스타일", desc: "EA FC 카드 느낌" },
  { id: "broadcast", name: "방송 스타일", desc: "TV 중계 인트로" },
  { id: "minimal", name: "미니멀", desc: "깔끔한 프로필" },
];

const STADIUM_BG = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect fill="#1a1a2e" width="600" height="400"/><ellipse cx="300" cy="350" rx="280" ry="60" fill="#16213e" opacity=".6"/><rect x="60" y="80" width="480" height="240" rx="4" fill="none" stroke="#0f3460" stroke-width="1.5" opacity=".4"/><line x1="300" y1="80" x2="300" y2="320" stroke="#0f3460" stroke-width="1" opacity=".3"/><circle cx="300" cy="200" r="50" fill="none" stroke="#0f3460" stroke-width="1" opacity=".3"/><rect x="60" y="150" width="80" height="100" fill="none" stroke="#0f3460" stroke-width="1" opacity=".25"/><rect x="460" y="150" width="80" height="100" fill="none" stroke="#0f3460" stroke-width="1" opacity=".25"/></svg>`);

function PlayerCardPreview({ data, template }) {
  const club = CLUBS.find(c => c.name === data.club) || CLUBS[0];
  
  if (template === "fifa") {
    return (
      <div style={{
        width: 340, height: 480, borderRadius: 16, overflow: "hidden",
        background: `linear-gradient(135deg, ${club.color} 0%, #0a0a0a 50%, ${club.accent}44 100%)`,
        position: "relative", fontFamily: "'Pretendard', sans-serif",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.08)"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: `url("${STADIUM_BG}") center/cover`, opacity: 0.15
        }}/>
        <div style={{
          position: "absolute", top: 0, right: 0, width: 120, height: 120,
          background: `radial-gradient(circle at top right, ${club.accent}33, transparent 70%)`
        }}/>
        
        <div style={{ position: "relative", zIndex: 1, padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{
                fontSize: 48, fontWeight: 900, color: "#fff", lineHeight: 1,
                textShadow: `2px 2px 20px ${club.accent}66`
              }}>{data.number || "9"}</div>
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: 3, color: "rgba(255,255,255,0.5)",
                marginTop: 4, textTransform: "uppercase"
              }}>{data.position || "ST"}</div>
            </div>
            <div style={{
              width: 48, height: 48, borderRadius: 8,
              background: `linear-gradient(135deg, ${club.color}, ${club.accent})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700, color: "#fff", textAlign: "center",
              letterSpacing: 0.5, lineHeight: 1.1, padding: 4,
              border: "1px solid rgba(255,255,255,0.15)"
            }}>{data.club?.replace("U12","").trim() || "FC"}</div>
          </div>
          
          <div style={{
            width: 160, height: 160, borderRadius: "50%", margin: "16px auto 12px",
            background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
            border: `2px solid ${club.accent}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden"
          }}>
            {data.photoUrl ? (
              <img src={data.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
            ) : (
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 13, fontWeight: 500, letterSpacing: 6, color: "rgba(255,255,255,0.45)",
              textTransform: "uppercase", marginBottom: 2
            }}>{data.firstName || "KANG"}</div>
            <div style={{
              fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: 2,
              textTransform: "uppercase", lineHeight: 1
            }}>{data.lastName || "CHOI"}</div>
          </div>
          
          <div style={{
            marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
            background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 0",
            border: "1px solid rgba(255,255,255,0.06)"
          }}>
            {[
              { label: "NATIONALITY", value: data.nationality || "KOREA" },
              null,
              { label: "CLUB", value: (data.club || "FC Seoul U12").replace("U12","").trim() },
              null,
              { label: "POSITION", value: data.position || "ST" }
            ].map((item, i) => item ? (
              <div key={i} style={{ textAlign: "center", padding: "0 8px" }}>
                <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: "rgba(255,255,255,0.35)" }}>{item.label}</div>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: club.accent, marginTop: 3, letterSpacing: 1
                }}>{item.value}</div>
              </div>
            ) : (
              <div key={i} style={{ background: "rgba(255,255,255,0.08)" }}/>
            ))}
          </div>
          
          <div style={{
            marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 6
          }}>
            {[
              { label: "나이", value: data.age || "13" },
              { label: "생년월일", value: data.birthDate || "2014.03.22" },
              { label: "키/몸무게", value: data.height && data.weight ? `${data.height}cm / ${data.weight}kg` : "160cm / 42kg" },
              { label: "주발", value: data.foot || "오른발" }
            ].map((s, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "6px 12px", borderRadius: 6,
                background: i % 2 === 0 ? `${club.color}22` : "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.04)"
              }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>{s.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: club.accent }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (template === "broadcast") {
    return (
      <div style={{
        width: 540, height: 320, borderRadius: 12, overflow: "hidden",
        background: `linear-gradient(135deg, #0a0a0a 0%, ${club.color}44 100%)`,
        position: "relative", fontFamily: "'Pretendard', sans-serif",
        boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.06)"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: `url("${STADIUM_BG}") center/cover`, opacity: 0.2
        }}/>
        <div style={{
          position: "absolute", top: 0, right: 0, width: "40%", height: "100%",
          background: `linear-gradient(90deg, transparent, ${club.color}33)`
        }}/>
        
        <div style={{ position: "relative", zIndex: 1, display: "flex", height: "100%" }}>
          <div style={{
            width: 200, display: "flex", alignItems: "flex-end",
            padding: "0 0 0 24px"
          }}>
            <div style={{
              width: 170, height: 220, borderRadius: "8px 8px 0 0", overflow: "hidden",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
              display: "flex", alignItems: "flex-end", justifyContent: "center"
            }}>
              {data.photoUrl ? (
                <img src={data.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
              ) : (
                <svg width="80" height="100" viewBox="0 0 24 28" fill="none" style={{ marginBottom: 10 }}>
                  <circle cx="12" cy="8" r="5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
                  <path d="M2 26c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
                </svg>
              )}
            </div>
          </div>
          
          <div style={{ flex: 1, padding: "28px 24px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{
                display: "inline-block", padding: "3px 12px", borderRadius: 4,
                background: club.accent, fontSize: 10, fontWeight: 700,
                color: "#fff", letterSpacing: 2, marginBottom: 8
              }}>PLAYER REVIEW</div>
              <div style={{
                fontSize: 14, fontWeight: 500, letterSpacing: 4,
                color: "rgba(255,255,255,0.5)", marginBottom: 2
              }}>{data.firstName || "KANG"}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{
                  fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: 2
                }}>{data.lastName || "CHOI"}</span>
                <span style={{
                  fontSize: 52, fontWeight: 900, color: "rgba(255,255,255,0.12)",
                  lineHeight: 1
                }}>{data.number || "9"}</span>
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                ["NAME", `${data.lastName || "CHOI"} ${data.firstName || "KANG"}`],
                ["NUMBER", data.number || "9"],
                ["POSITION", data.position || "CENTER FORWARD"],
                ["CLUB", data.club || "FC SEOUL U12"],
                ["BIRTH", data.birthDate || "2014.03.22"],
              ].map(([label, value], i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", fontSize: 11, height: 26
                }}>
                  <span style={{
                    width: 80, fontWeight: 600, color: "rgba(255,255,255,0.35)",
                    letterSpacing: 2, fontSize: 9
                  }}>{label}</span>
                  <span style={{
                    flex: 1, padding: "3px 12px", borderRadius: 4,
                    background: i % 2 === 0 ? `${club.accent}22` : "rgba(255,255,255,0.04)",
                    fontWeight: 700, color: i % 2 === 0 ? club.accent : "rgba(255,255,255,0.7)",
                    letterSpacing: 1
                  }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${club.color}, ${club.accent}, ${club.color})`
        }}/>
      </div>
    );
  }
  
  return (
    <div style={{
      width: 340, height: 440, borderRadius: 16, overflow: "hidden",
      background: "#fafafa", position: "relative",
      fontFamily: "'Pretendard', sans-serif",
      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      border: "1px solid rgba(0,0,0,0.06)"
    }}>
      <div style={{
        height: 4, background: `linear-gradient(90deg, ${club.color}, ${club.accent})`
      }}/>
      <div style={{ padding: "28px 28px 20px", textAlign: "center" }}>
        <div style={{
          width: 120, height: 120, borderRadius: "50%", margin: "0 auto 16px",
          background: "#f0f0f0", border: `3px solid ${club.accent}22`,
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
        }}>
          {data.photoUrl ? (
            <img src={data.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
          ) : (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#ccc" strokeWidth="1.5"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 4, color: "#999", marginBottom: 4 }}>
          {data.position || "FORWARD"} · #{data.number || "9"}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#111", letterSpacing: 1 }}>
          {data.lastName || "최"}{data.firstName || "강"}
        </div>
        <div style={{
          display: "inline-block", marginTop: 8, padding: "4px 14px",
          borderRadius: 20, background: `${club.accent}15`, color: club.color,
          fontSize: 12, fontWeight: 600
        }}>{data.club || "FC Seoul U12"}</div>
      </div>
      
      <div style={{ padding: "0 28px" }}>
        <div style={{ height: 1, background: "#eee", marginBottom: 16 }}/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            ["생년월일", data.birthDate || "2014.03.22"],
            ["나이", data.age || "13"],
            ["키", data.height ? `${data.height}cm` : "160cm"],
            ["몸무게", data.weight ? `${data.weight}kg` : "42kg"],
            ["주발", data.foot || "오른발"],
            ["국적", data.nationality || "대한민국"]
          ].map(([label, value], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ fontSize: 12, color: "#999" }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{
        position: "absolute", bottom: 16, left: 28, right: 28,
        textAlign: "center", fontSize: 9, color: "#ccc", letterSpacing: 2
      }}>FOOTORY.COM</div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 600,
        color: "#888", letterSpacing: 1.5, marginBottom: 5, textTransform: "uppercase"
      }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", style = {} }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "8px 12px", borderRadius: 8,
        border: "1px solid #e0e0e0", fontSize: 14, outline: "none",
        background: "#fff", boxSizing: "border-box",
        transition: "border-color 0.2s",
        ...style
      }}
      onFocus={e => e.target.style.borderColor = "#C0392B"}
      onBlur={e => e.target.style.borderColor = "#e0e0e0"}
    />
  );
}

export default function FootoryEditor() {
  const [template, setTemplate] = useState("fifa");
  const [data, setData] = useState({
    firstName: "강", lastName: "최",
    number: "9", position: "ST",
    club: "FC Seoul U12",
    age: "13", birthDate: "2014.03.22",
    height: "160", weight: "42",
    foot: "오른발", nationality: "KOREA",
    photoUrl: ""
  });
  const fileRef = useRef(null);
  
  const update = useCallback((key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const handlePhoto = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => update("photoUrl", ev.target.result);
      reader.readAsDataURL(file);
    }
  }, [update]);
  
  return (
    <div style={{
      fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
      minHeight: "100vh", background: "#f5f4f0"
    }}>
      <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet"/>
      
      <header style={{
        padding: "20px 28px", background: "#fff",
        borderBottom: "1px solid #eee", display: "flex",
        alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #C0392B, #E74C3C)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "#fff"
          }}>F</div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
            <span style={{ color: "#C0392B" }}>Foot</span>
            <span style={{ color: "#333" }}>ory</span>
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "2px 8px",
            borderRadius: 10, background: "#FEF3E2", color: "#E67E22",
            letterSpacing: 1
          }}>BETA</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid #ddd",
            background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            color: "#666"
          }}>미리보기</button>
          <button style={{
            padding: "8px 20px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg, #C0392B, #E74C3C)",
            fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#fff",
            boxShadow: "0 4px 12px rgba(192,57,43,0.3)"
          }}>영상 생성 →</button>
        </div>
      </header>
      
      <div style={{
        display: "flex", maxWidth: 1200, margin: "0 auto", minHeight: "calc(100vh - 73px)"
      }}>
        <div style={{
          width: 360, background: "#fff", borderRight: "1px solid #eee",
          padding: "20px 24px", overflowY: "auto", maxHeight: "calc(100vh - 73px)"
        }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: "#333", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 8
          }}>
            <span style={{ fontSize: 16 }}>⚽</span> 선수 정보
          </div>
          
          <FormField label="사진">
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: "100%", height: 80, borderRadius: 10,
                border: "2px dashed #ddd", display: "flex",
                alignItems: "center", justifyContent: "center", gap: 8,
                cursor: "pointer", background: "#fafafa",
                transition: "border-color 0.2s, background 0.2s",
                fontSize: 13, color: "#999"
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "#C0392B"; e.currentTarget.style.background = "#fff5f5"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "#ddd"; e.currentTarget.style.background = "#fafafa"; }}
            >
              {data.photoUrl ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img src={data.photoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }}/>
                  <span>사진 변경</span>
                </div>
              ) : (
                <span>+ 선수 사진 업로드</span>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }}/>
          </FormField>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FormField label="성">
              <Input value={data.lastName} onChange={v => update("lastName", v)} placeholder="최"/>
            </FormField>
            <FormField label="이름">
              <Input value={data.firstName} onChange={v => update("firstName", v)} placeholder="강"/>
            </FormField>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FormField label="등번호">
              <Input value={data.number} onChange={v => update("number", v)} placeholder="9" type="number"/>
            </FormField>
            <FormField label="포지션">
              <select
                value={data.position}
                onChange={e => update("position", e.target.value)}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  border: "1px solid #e0e0e0", fontSize: 14,
                  background: "#fff", cursor: "pointer", outline: "none"
                }}
              >
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>
          </div>
          
          <FormField label="소속 구단">
            <select
              value={data.club}
              onChange={e => update("club", e.target.value)}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 8,
                border: "1px solid #e0e0e0", fontSize: 14,
                background: "#fff", cursor: "pointer", outline: "none"
              }}
            >
              {CLUBS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </FormField>
          
          <div style={{
            height: 1, background: "#f0f0f0", margin: "16px 0"
          }}/>
          
          <div style={{
            fontSize: 14, fontWeight: 700, color: "#333", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 8
          }}>
            <span style={{ fontSize: 16 }}>📋</span> 상세 정보
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FormField label="나이">
              <Input value={data.age} onChange={v => update("age", v)} placeholder="13"/>
            </FormField>
            <FormField label="생년월일">
              <Input value={data.birthDate} onChange={v => update("birthDate", v)} placeholder="2014.03.22"/>
            </FormField>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FormField label="키 (cm)">
              <Input value={data.height} onChange={v => update("height", v)} placeholder="160" type="number"/>
            </FormField>
            <FormField label="몸무게 (kg)">
              <Input value={data.weight} onChange={v => update("weight", v)} placeholder="42" type="number"/>
            </FormField>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FormField label="주발">
              <select
                value={data.foot}
                onChange={e => update("foot", e.target.value)}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  border: "1px solid #e0e0e0", fontSize: 14,
                  background: "#fff", cursor: "pointer", outline: "none"
                }}
              >
                <option value="오른발">오른발</option>
                <option value="왼발">왼발</option>
                <option value="양발">양발</option>
              </select>
            </FormField>
            <FormField label="국적">
              <Input value={data.nationality} onChange={v => update("nationality", v)} placeholder="KOREA"/>
            </FormField>
          </div>
        </div>
        
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: 32, gap: 24, background: "#f5f4f0"
        }}>
          <div style={{
            display: "flex", gap: 8, background: "#fff",
            padding: 4, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}>
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none",
                  background: template === t.id ? "#C0392B" : "transparent",
                  color: template === t.id ? "#fff" : "#666",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
          
          <div style={{
            transform: "scale(0.95)", transition: "transform 0.3s",
            filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))"
          }}>
            <PlayerCardPreview data={data} template={template}/>
          </div>
          
          <div style={{
            display: "flex", gap: 12, marginTop: 8
          }}>
            <button style={{
              padding: "10px 24px", borderRadius: 10, border: "1px solid #ddd",
              background: "#fff", fontSize: 13, fontWeight: 600,
              cursor: "pointer", color: "#666", display: "flex", alignItems: "center", gap: 6
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              이미지 저장
            </button>
            <button style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #C0392B, #E74C3C)",
              fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#fff",
              boxShadow: "0 4px 16px rgba(192,57,43,0.3)",
              display: "flex", alignItems: "center", gap: 6
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              영상으로 제작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}