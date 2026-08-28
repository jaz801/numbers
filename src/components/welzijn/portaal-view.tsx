// Auto-generated from the Welzijn Portaal design. Edit the design, not this file.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment } from "react";
import { css } from "./css";

export const hoverCss = `.hv1:hover{background:#27CFC3}
.hv2:hover{border-color:#00B0A8;color:#00857f}
.hv3:hover{background:#f7b587}
.hv4:hover{color:#8a4b1f}`;

export function renderView(B: any) {
  return (
    <>
      <div style={css("min-height:100vh;background:#fbfaf8;padding-bottom:80px")}>
        <div style={css("background:#fff;border-bottom:1px solid #e8e6e2;position:sticky;top:0;z-index:20")}>
          <div style={css("max-width:1100px;margin:0 auto;padding:0 28px;height:70px;display:flex;align-items:center;gap:28px")}>
            <div style={css("display:flex;align-items:baseline;gap:10px")}>
              <span style={css("font-size:23px;font-weight:700;letter-spacing:-.03em")}>namber</span>
              <span style={css("width:7px;height:7px;border-radius:50%;background:#00B0A8;display:inline-block")} />
              <span style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#6b6b6b")}>welzijn portaal</span>
            </div>
            <div style={css("flex:1")} />
            <div style={css("display:flex;gap:4px")}>
              <button onClick={B.goPortaal} style={css(B.tabPortaal)}>Werknemers</button>
              <button onClick={B.goInstellingen} style={css(B.tabInstellingen)}>Instellingen</button>
              <button onClick={B.goDashboard} style={css(B.tabDashboard)}>Dashboard</button>
            </div>
          </div>
        </div>
        {B.isPortaal ? (
          <>
            <div style={css("max-width:1100px;margin:0 auto;padding:44px 28px 0;animation:rise .25s ease both")}>
              <p style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#00857f;margin:0 0 12px")}>Stap 1 · werknemers</p>
              <h1 style={css("font-size:40px;line-height:1.1;font-weight:700;letter-spacing:-.025em;margin:0 0 12px")}>Wie doet er mee aan deze pulse?</h1>
              <p style={css("font-size:18px;line-height:1.55;color:#5c5c5c;max-width:560px;margin:0 0 34px;text-wrap:pretty")}>Voeg jezelf toe met naam, foto en e-mailadres. Intern of extern bepaalt in welk segment je antwoord straks meetelt.</p>
              <div style={css("display:grid;grid-template-columns:1.6fr 1fr;gap:22px;align-items:start")}>
                <div>
                  <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px")}>
                    {B.people.map((p: any, pI: number) => (
                      <Fragment key={pI}>
                        <div style={css("background:#fff;border:1px solid #e8e6e2;border-radius:5px;padding:16px")}>
                          <div style={css("display:flex;gap:12px;align-items:center")}>
                            {p.foto ? (
                              <>
                                <div style={css("width:46px;height:46px;border-radius:50%;overflow:hidden;flex:none")}>{p.fotoEl}</div>
                              </>
                            ) : null}
                            {p.geenFoto ? (
                              <>
                                <div style={css(p.avatarStyle)}>{p.initialen}</div>
                              </>
                            ) : null}
                            <div style={css("min-width:0")}>
                              <div style={css("font-weight:600;font-size:15.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{p.naam}</div>
                              <div style={css("font-size:13px;color:#7a7a7a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{p.email}</div>
                            </div>
                          </div>
                          <div style={css("display:flex;align-items:center;gap:8px;margin-top:14px")}>
                            <span style={css(p.badgeStyle)}>{p.type}</span>
                            <span style={css("flex:1")} />
                            <span style={css(`font-family:var(--font-plex-mono),monospace;font-size:11px;color:${p.statusKleur}`)}>{p.status}</span>
                          </div>
                          {p.heeftLink ? (
                            <>
                              <div style={css("display:flex;gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid #f0eeea")}>
                                <button onClick={p.openPulse} style={css("flex:1;background:#00B0A8;color:#fff;border:none;border-radius:200px;padding:8px 14px;font-size:13.5px;font-weight:500;cursor:pointer")} className="hv1">Vul in</button>
                                <button onClick={p.copyLink} style={css("background:#fff;color:#1F1F1F;border:1px solid #dcdad6;border-radius:200px;padding:8px 12px;font-size:13.5px;cursor:pointer")} className="hv2">{p.copyLabel}</button>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div style={css("margin-top:22px;background:#1F1F1F;border-radius:5px;padding:22px 24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap")}>
                    <div style={css("flex:1;min-width:240px")}>
                      <div style={css("color:#fff;font-size:17px;font-weight:600;margin-bottom:4px")}>Verstuur de pulse</div>
                      <div style={css("color:#a5a5a5;font-size:14px;line-height:1.5")}>{B.verzendUitleg}</div>
                    </div>
                    <button onClick={B.verstuur} style={css("background:#F5A46C;color:#fff;border:none;border-radius:200px;padding:13px 26px;font-size:15px;font-weight:600;cursor:pointer;flex:none")} className="hv3">{B.verzendLabel}</button>
                  </div>
                  {B.verzonden ? (
                    <>
                      <p style={css("font-size:14px;color:#5c5c5c;margin:12px 0 0;line-height:1.5")}>Komt de mail niet aan? Elke werknemer heeft hierboven een kopieerbare invullink — die is het terugvalpad tijdens de demo.</p>
                    </>
                  ) : null}
                </div>
                <div style={css("background:#fff;border:1px solid #e8e6e2;border-top:3px solid #F5A46C;border-radius:5px;padding:22px 22px 24px")}>
                  <div style={css("font-size:17px;font-weight:600;margin-bottom:16px")}>Werknemer toevoegen</div>
                  <label style={css("display:block;font-size:12.5px;font-weight:500;color:#5c5c5c;margin-bottom:5px")}>Naam</label>
                  <input value={B.nieuwNaam} onChange={B.setNaam} placeholder="Voornaam en achternaam" style={css("width:100%;border:1px solid #dcdad6;background:transparent;border-radius:0;padding:9px 11px;font-size:14.5px;margin-bottom:14px")} />
                  <label style={css("display:block;font-size:12.5px;font-weight:500;color:#5c5c5c;margin-bottom:5px")}>E-mailadres</label>
                  <input value={B.nieuwEmail} onChange={B.setEmail} placeholder="naam@voorbeeld.nl" style={css("width:100%;border:1px solid #dcdad6;background:transparent;border-radius:0;padding:9px 11px;font-size:14.5px;margin-bottom:14px")} />
                  <label style={css("display:block;font-size:12.5px;font-weight:500;color:#5c5c5c;margin-bottom:5px")}>Segment</label>
                  <div style={css("display:flex;gap:6px;margin-bottom:14px")}>
                    <button onClick={B.kiesIntern} style={css(B.segInternStyle)}>Intern</button>
                    <button onClick={B.kiesExtern} style={css(B.segExternStyle)}>Extern</button>
                  </div>
                  <label style={css("display:block;font-size:12.5px;font-weight:500;color:#5c5c5c;margin-bottom:5px")}>Context (vrijwillig)</label>
                  <select value={B.nieuwContext} onChange={B.setContext} style={css("width:100%;border:1px solid #dcdad6;background:#fff;border-radius:0;padding:9px 10px;font-size:14px;margin-bottom:4px")}>
                    {B.contextOpties.map((c: any, cI: number) => (
                      <Fragment key={cI}>
                        <option value={c.key}>{c.label}</option>
                      </Fragment>
                    ))}
                  </select>
                  <p style={css("font-size:11.5px;color:#9a9a9a;margin:0 0 14px;line-height:1.45")}>Alleen delen als de werknemer dat zelf wil. Het bepaalt hoe de scores gelezen worden, niet wie ze te zien krijgt.</p>
                  <label style={css("display:block;font-size:12.5px;font-weight:500;color:#5c5c5c;margin-bottom:5px")}>Foto</label>
                  <div style={css("display:flex;align-items:center;gap:12px;margin-bottom:18px")}>
                    {B.nieuwFoto ? (
                      <>
                        <div style={css("width:42px;height:42px;border-radius:50%;overflow:hidden;flex:none")}>{B.nieuwFotoEl}</div>
                      </>
                    ) : null}
                    <input type="file" accept="image/*" onChange={B.kiesFoto} style={css("font-size:12.5px;color:#5c5c5c;max-width:100%")} />
                  </div>
                  <button onClick={B.voegToe} style={css("width:100%;background:#00B0A8;color:#fff;border:none;border-radius:200px;padding:12px;font-size:15px;font-weight:600;cursor:pointer")} className="hv1">Toevoegen</button>
                  <p style={css("font-size:12.5px;color:#8a8a8a;margin:10px 0 0;line-height:1.5")}>{B.formMelding}</p>
                </div>
              </div>
            </div>
          </>
        ) : null}
        {B.isInstellingen ? (
          <>
            <div style={css("max-width:1100px;margin:0 auto;padding:44px 28px 0;animation:rise .25s ease both")}>
              <p style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#00857f;margin:0 0 12px")}>Stap 2 · ritme en vragen</p>
              <h1 style={css("font-size:40px;line-height:1.1;font-weight:700;letter-spacing:-.025em;margin:0 0 12px")}>Instellingen</h1>
              <p style={css("font-size:18px;line-height:1.55;color:#5c5c5c;max-width:560px;margin:0 0 34px;text-wrap:pretty")}>Het ritme, de anonimiteit en de vragenpool. Wat je hier kiest wordt vastgelegd op het moment dat je verstuurt.</p>
              <div style={css("display:grid;grid-template-columns:1fr 1.35fr;gap:22px;align-items:start")}>
                <div style={css("background:#fff;border:1px solid #e8e6e2;border-top:3px solid #00B0A8;border-radius:5px;padding:22px 24px 26px")}>
                  <div style={css("font-size:17px;font-weight:600;margin-bottom:18px")}>Ritme</div>
                  <label style={css("display:block;font-size:12.5px;font-weight:500;color:#5c5c5c;margin-bottom:6px")}>Interval</label>
                  <div style={css("display:flex;gap:6px;margin-bottom:8px")}>
                    <button onClick={B.kiesMaand} style={css(B.intMaandStyle)}>Maandelijks · 5 vragen</button>
                    <button onClick={B.kiesKwartaal} style={css(B.intKwartaalStyle)}>Kwartaal · 12 vragen</button>
                  </div>
                  <p style={css("font-size:12.5px;color:#8a8a8a;margin:0 0 20px;line-height:1.5")}>{B.intervalUitleg}</p>
                  <label style={css("display:block;font-size:12.5px;font-weight:500;color:#5c5c5c;margin-bottom:6px")}>Verstuurdagen</label>
                  <div style={css("display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px")}>
                    {B.dagen.map((d: any, dI: number) => (
                      <Fragment key={dI}>
                        <button onClick={d.toggle} style={css(d.style)}>{d.label}</button>
                      </Fragment>
                    ))}
                  </div>
                  <p style={css("font-size:12.5px;color:#8a8a8a;margin:0 0 14px")}>Volgende pulse: <b style={css("color:#1F1F1F;font-weight:600")}>{B.volgendePulse}</b></p>
                  <div style={css("display:flex;align-items:center;gap:14px;padding-bottom:4px")}>
                    <div style={css("flex:1")}>
                      <div style={css("font-size:14.5px;font-weight:500")}>Verstuurdagen randomiseren</div>
                      <div style={css("font-size:12.5px;color:#8a8a8a;line-height:1.45")}>{B.randomDagenUitleg}</div>
                    </div>
                    <button onClick={B.toggleRandomDagen} style={css(B.randomDagenStyle)}>
                      <span style={css(B.randomDagenKnop)} />
                    </button>
                  </div>
                  <div style={css("border-top:1px solid #f0eeea;padding-top:18px;margin-top:18px;display:flex;flex-direction:column;gap:14px")}>
                    <div style={css("display:flex;align-items:center;gap:14px")}>
                      <div style={css("flex:1")}>
                        <div style={css("font-size:14.5px;font-weight:500")}>Vragen randomiseren</div>
                        <div style={css("font-size:12.5px;color:#8a8a8a;line-height:1.45")}>Eén willekeurige vraag per thema, vastgelegd bij versturen</div>
                      </div>
                      <button onClick={B.toggleRandom} style={css(B.randomStyle)}>
                        <span style={css(B.randomKnop)} />
                      </button>
                    </div>
                    <div style={css("display:flex;align-items:center;gap:14px")}>
                      <div style={css("flex:1")}>
                        <div style={css("font-size:14.5px;font-weight:500")}>Anoniem verwerken</div>
                        <div style={css("font-size:12.5px;color:#8a8a8a;line-height:1.45")}>De token wordt weggegooid na het opslaan</div>
                      </div>
                      <button onClick={B.toggleAnoniem} style={css(B.anoniemStyle)}>
                        <span style={css(B.anoniemKnop)} />
                      </button>
                    </div>
                    <div style={css("display:flex;align-items:center;gap:14px")}>
                      <div style={css("flex:1")}>
                        <div style={css("font-size:14.5px;font-weight:500")}>Privacydrempel (n)</div>
                        <div style={css("font-size:12.5px;color:#8a8a8a;line-height:1.45")}>Segment tonen vanaf dit aantal antwoorden</div>
                      </div>
                      <div style={css("display:flex;align-items:center;gap:8px")}>
                        <button onClick={B.drempelMin} style={css("width:30px;height:30px;border:1px solid #dcdad6;background:#fff;border-radius:5px;font-size:16px;cursor:pointer;line-height:1")}>–</button>
                        <span style={css("font-family:var(--font-plex-mono),monospace;font-size:15px;width:16px;text-align:center")}>{B.drempel}</span>
                        <button onClick={B.drempelPlus} style={css("width:30px;height:30px;border:1px solid #dcdad6;background:#fff;border-radius:5px;font-size:16px;cursor:pointer;line-height:1")}>+</button>
                      </div>
                    </div>
                  </div>
                  <div style={css("margin-top:20px;background:#fbf0e7;border-left:3px solid #F5A46C;padding:14px 16px;border-radius:0 5px 5px 0")}>
                    <p style={css("margin:0;font-size:13.5px;line-height:1.55;color:#6b4426")}>Productie staat op n=5. Voor deze demo mag hij lager — dat benoemen is sterker dan de regel stil negeren.</p>
                  </div>
                </div>
                <div style={css("background:#fff;border:1px solid #e8e6e2;border-top:3px solid #27CFC3;border-radius:5px;padding:22px 24px 26px")}>
                  <div style={css("display:flex;align-items:baseline;gap:10px;margin-bottom:6px")}>
                    <div style={css("font-size:17px;font-weight:600")}>Vragenpool</div>
                    <span style={css("font-family:var(--font-plex-mono),monospace;font-size:11px;color:#7a7a7a")}>{B.poolTelling}</span>
                  </div>
                  <p style={css("font-size:13.5px;color:#8a8a8a;margin:0 0 18px;line-height:1.5")}>Vier thema&apos;s. Vink uit wat niet past, of voeg een eigen vraag toe.</p>
                  <div style={css("max-height:520px;overflow-y:auto;padding-right:6px;margin-right:-6px")}>
                    {B.themas.map((t: any, tI: number) => (
                      <Fragment key={tI}>
                        <div style={css("margin-bottom:20px")}>
                          <div style={css("display:flex;align-items:center;gap:9px;margin-bottom:8px")}>
                            <span style={css(`width:9px;height:9px;border-radius:2px;background:${t.kleur};display:inline-block`)} />
                            <span style={css("font-size:14.5px;font-weight:600")}>{t.naam}</span>
                            <span style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;color:#9a9a9a")}>{t.telling}</span>
                          </div>
                          <div style={css("display:flex;flex-direction:column;gap:2px")}>
                            {t.vragen.map((v: any, vI: number) => (
                              <Fragment key={vI}>
                                <button onClick={v.toggle} style={css(v.style)}>
                                  <span style={css(v.vinkStyle)}>{v.vink}</span>
                                  <span style={css("text-align:left;flex:1")}>{v.tekst}</span>
                                  <span style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;color:#b0b0b0")}>{v.id}</span>
                                </button>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div style={css("display:flex;gap:8px;border-top:1px solid #f0eeea;padding-top:18px;margin-top:18px")}>
                    <input value={B.nieuwVraag} onChange={B.setVraag} placeholder="Eigen vraag toevoegen…" style={css("flex:1;border:1px solid #dcdad6;background:transparent;border-radius:0;padding:9px 11px;font-size:14px")} />
                    <select value={B.nieuwVraagThema} onChange={B.setVraagThema} style={css("border:1px solid #dcdad6;background:#fff;border-radius:0;padding:9px;font-size:13.5px")}>
                      {B.themas.map((t: any, tI: number) => (
                        <Fragment key={tI}>
                          <option value={t.key}>{t.naam}</option>
                        </Fragment>
                      ))}
                    </select>
                    <button onClick={B.voegVraagToe} style={css("background:#00B0A8;color:#fff;border:none;border-radius:200px;padding:9px 18px;font-size:14px;font-weight:500;cursor:pointer")} className="hv1">Toevoegen</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
        {B.isPulse ? (
          <>
            <div style={css("max-width:640px;margin:0 auto;padding:44px 28px 0;animation:rise .25s ease both")}>
              {B.pulseOpen ? (
                <>
                  <div style={css("background:#fff;border:1px solid #e8e6e2;border-radius:5px;padding:32px 34px 34px")}>
                    <p style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#00857f;margin:0 0 10px")}>{B.pulseTitel}</p>
                    <h1 style={css("font-size:29px;line-height:1.15;font-weight:700;letter-spacing:-.02em;margin:0 0 8px")}>Hoi {B.pulseNaam}, hoe gaat het echt?</h1>
                    <p style={css("font-size:15.5px;color:#5c5c5c;line-height:1.55;margin:0 0 6px")}>Vijf vragen, dertig seconden. {B.pulseAnoniemTekst}</p>
                    <div style={css("height:4px;background:#f0eeea;border-radius:200px;margin:22px 0 30px;overflow:hidden")}>
                      <div style={css(`height:4px;background:#00B0A8;border-radius:200px;transition:width .3s ease;width:${B.pulseVoortgang}%`)} />
                    </div>
                    {B.pulseVragen.map((v: any, vI: number) => (
                      <Fragment key={vI}>
                        <div style={css("margin-bottom:26px")}>
                          <div style={css(`font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:${v.kleur};margin-bottom:6px`)}>{v.thema}</div>
                          <div style={css("font-size:17px;line-height:1.4;font-weight:500;margin-bottom:12px;text-wrap:pretty")}>{v.tekst}</div>
                          <div style={css("display:flex;gap:6px")}>
                            {v.opties.map((o: any, oI: number) => (
                              <Fragment key={oI}>
                                <button onClick={o.pick} style={css(o.style)}>{o.label}</button>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      </Fragment>
                    ))}
                    <div style={css("margin-bottom:24px")}>
                      <div style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#F5A46C;margin-bottom:6px")}>Open vraag</div>
                      <div style={css("font-size:17px;line-height:1.4;font-weight:500;margin-bottom:12px")}>Is er nog iets wat je wilt delen?</div>
                      <textarea value={B.pulseOpenTekst} onChange={B.setOpenTekst} rows={3} placeholder="Optioneel" style={css("width:100%;border:1px solid #dcdad6;background:transparent;border-radius:0;padding:10px 12px;font-size:14.5px;line-height:1.5;resize:vertical")} />
                    </div>
                    <button onClick={B.verzendAntwoord} style={css(B.pulseVerzendStyle)}>{B.pulseVerzendLabel}</button>
                  </div>
                </>
              ) : null}
              {B.pulseKlaar ? (
                <>
                  <div style={css("background:#fff;border:1px solid #e8e6e2;border-radius:5px;padding:44px 34px;text-align:center")}>
                    <div style={css("width:52px;height:52px;border-radius:50%;background:#eaf6f5;color:#00857f;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 18px")}>✓</div>
                    <h1 style={css("font-size:26px;font-weight:700;letter-spacing:-.02em;margin:0 0 10px")}>Dank je.</h1>
                    <p style={css("font-size:15.5px;color:#5c5c5c;line-height:1.55;margin:0 0 24px")}>{B.dankTekst}</p>
                    <button onClick={B.goDashboard} style={css("background:#F5A46C;color:#fff;border:none;border-radius:200px;padding:12px 24px;font-size:15px;font-weight:600;cursor:pointer")} className="hv3">Bekijk het dashboard</button>
                  </div>
                </>
              ) : null}
            </div>
          </>
        ) : null}
        {B.isDashboard ? (
          <>
            <div style={css("max-width:1100px;margin:0 auto;padding:44px 28px 0;animation:rise .25s ease both")}>
              <div style={css("display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-bottom:18px")}>
                <div style={css("flex:1;min-width:280px")}>
                  <p style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#00857f;margin:0 0 12px")}>Stap 3 · uitkomst</p>
                  <h1 style={css("font-size:40px;line-height:1.1;font-weight:700;letter-spacing:-.025em;margin:0 0 10px")}>Pulse {B.pulseLabel}</h1>
                  <p style={css("font-size:17px;color:#5c5c5c;margin:0")}>{B.responsTekst}</p>
                </div>
                <div style={css("display:flex;gap:6px;flex:none")}>
                  <button onClick={B.goOrgView} style={css(B.viewOrgStyle)}>Organisatie</button>
                  <button onClick={B.goPersoonView} style={css(B.viewPersoonStyle)}>Per persoon</button>
                </div>
              </div>
              <div style={css("background:#fff;border:1px solid #e8e6e2;border-radius:5px;padding:14px 20px;margin-bottom:22px;display:flex;align-items:center;gap:22px;flex-wrap:wrap")}>
                <div style={css("display:flex;align-items:center;gap:11px;flex:none")}>
                  <button onClick={B.toggleExportAnoniem} style={css(B.exportAnoniemStyle)}>
                    <span style={css(B.exportAnoniemKnop)} />
                  </button>
                  <span style={css("font-size:14px;font-weight:500")}>Anonimiseren</span>
                </div>
                <span style={css("flex:1;min-width:220px;font-size:12.5px;color:#9a9a9a;line-height:1.45")}>{B.exportAnoniemTekst}</span>
                <div style={css("display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:none")}>
                  <span style={css("font-family:var(--font-plex-mono),monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#b0b0b0")}>export</span>
                  <button onClick={B.exportHuidig} style={css("background:#fff;color:#1F1F1F;border:1px solid #dcdad6;border-radius:200px;padding:8px 16px;font-size:13.5px;font-weight:500;cursor:pointer;font-family:inherit")} className="hv2">{B.exportHuidigLabel}</button>
                  <button onClick={B.beeld.alleN} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:8px 16px;font-size:13.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">Alle plaatjes</button>
                  <button onClick={B.beeld.alleA} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:8px 16px;font-size:13.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">Alle plaatjes anoniem</button>
                </div>
                {B.heeftBeeldMelding ? (
                  <>
                    <span style={css("font-size:12.5px;color:#00857f;flex:none")}>{B.beeldMelding}</span>
                  </>
                ) : null}
              </div>
              {B.isOrgView ? (
                <>
                  <div style={css("margin-bottom:22px")}>
                    <div style={css("display:flex;justify-content:flex-end;gap:6px;margin-bottom:8px")}>
                      <button onClick={B.beeld.orgThemasN} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG</button>
                      <button onClick={B.beeld.orgThemasA} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG anoniem</button>
                    </div>
                    <div data-export="orgThemas" style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;background:#fbfaf8")}>
                      {B.scores.map((s: any, sI: number) => (
                        <Fragment key={sI}>
                          <div style={css("background:#fff;border:1px solid #e8e6e2;border-radius:5px;padding:18px 20px 20px")}>
                            <div style={css("display:flex;align-items:baseline;gap:8px;margin-bottom:14px")}>
                              <span style={css("font-size:14px;font-weight:600;line-height:1.3;flex:1")}>{s.naam}</span>
                              <span style={css(`font-family:var(--font-plex-mono),monospace;font-size:11px;color:${s.deltaKleur}`)}>{s.delta}</span>
                            </div>
                            <div style={css("display:flex;align-items:baseline;gap:6px;margin-bottom:12px")}>
                              <span style={css("font-size:34px;font-weight:700;letter-spacing:-.03em;line-height:1")}>{s.score}</span>
                              <span style={css("font-size:14px;color:#9a9a9a")}>/ 5</span>
                            </div>
                            <div style={css("height:6px;background:#f0eeea;border-radius:200px;overflow:hidden")}>
                              <div style={css(`height:6px;border-radius:200px;transition:width .5s ease;background:${s.kleur};width:${s.pct}%`)} />
                            </div>
                            <div style={css("display:flex;gap:14px;margin-top:12px;font-size:12.5px;color:#7a7a7a")}>
                              <span>Intern <b style={css("color:#1F1F1F;font-weight:600")}>{s.intern}</b></span>
                              <span>Extern <b style={css("color:#1F1F1F;font-weight:600")}>{s.extern}</b></span>
                            </div>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div style={css("margin-bottom:22px")}>
                    <div style={css("display:flex;justify-content:flex-end;gap:6px;margin-bottom:8px")}>
                      <button onClick={B.beeld.orgBetrokkenN} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG</button>
                      <button onClick={B.beeld.orgBetrokkenA} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG anoniem</button>
                    </div>
                    <div data-export="orgBetrokken" style={css("background:#fff;border:1px solid #e8e6e2;border-radius:5px;padding:22px 26px 24px;display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:start")}>
                      <div>
                        <div style={css("display:flex;align-items:baseline;gap:10px;margin-bottom:4px")}>
                          <div style={css("font-size:17px;font-weight:600")}>Betrokkenheid</div>
                          <span style={css("font-family:var(--font-plex-mono),monospace;font-size:11px;color:#7a7a7a")}>wie antwoordt, en hoe snel</span>
                        </div>
                        <p style={css("font-size:13.5px;color:#8a8a8a;margin:0 0 18px")}>{B.betrokkenNoot}</p>
                        <div style={css("display:flex;gap:28px;flex-wrap:wrap")}>
                          <div>
                            <div style={css("display:flex;align-items:baseline;gap:5px")}>
                              <span style={css("font-size:34px;font-weight:700;letter-spacing:-.03em;line-height:1")}>{B.betrokken.graad}</span>
                              <span style={css("font-size:16px;color:#9a9a9a")}>%</span>
                            </div>
                            <div style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#7a7a7a;margin-top:4px")}>responsgraad</div>
                            <div style={css("font-size:13px;color:#5c5c5c;margin-top:4px")}>{B.betrokken.ingevuld} van {B.betrokken.uitgenodigd} ingevuld</div>
                          </div>
                          <div>
                            <div style={css("font-size:24px;font-weight:700;letter-spacing:-.02em;line-height:1.2")}>{B.betrokken.mediaan}</div>
                            <div style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#7a7a7a;margin-top:4px")}>mediane reactietijd</div>
                            <div style={css("font-size:13px;color:#5c5c5c;margin-top:4px")}>snelst {B.betrokken.snelste} · traagst {B.betrokken.langzaamste}</div>
                          </div>
                        </div>
                      </div>
                      <div style={css("display:flex;flex-direction:column;gap:12px;padding-top:6px")}>
                        {B.betrokken.buckets.map((b: any, bI: number) => (
                          <Fragment key={bI}>
                            <div>
                              <div style={css("display:flex;align-items:baseline;gap:8px;margin-bottom:5px")}>
                                <span style={css("font-size:13.5px;font-weight:500;flex:1")}>{b.label}</span>
                                <span style={css("font-family:var(--font-plex-mono),monospace;font-size:12px;color:#5c5c5c")}>{b.n}</span>
                                <span style={css("font-family:var(--font-plex-mono),monospace;font-size:11px;color:#a8a8a8")}>{b.pct}%</span>
                              </div>
                              <div style={css("height:8px;background:#f4f2ee;border-radius:200px;overflow:hidden")}>
                                <div style={css(b.balk)} />
                              </div>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={css("margin-bottom:22px")}>
                    <div style={css("display:flex;justify-content:flex-end;gap:6px;margin-bottom:8px")}>
                      <button onClick={B.beeld.orgVerloopN} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG</button>
                      <button onClick={B.beeld.orgVerloopA} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG anoniem</button>
                    </div>
                    <div data-export="orgVerloop" style={css("background:#fff;border:1px solid #e8e6e2;border-radius:5px;padding:22px 26px 24px;display:grid;grid-template-columns:1fr 260px;gap:26px;align-items:start")}>
                      <div><div style={css("display:flex;align-items:baseline;gap:10px;margin-bottom:4px")}><div style={css("font-size:17px;font-weight:600")}>Verloop per maand</div><span style={css("font-family:var(--font-plex-mono),monospace;font-size:11px;color:#7a7a7a")}>mei–juli voorbeelddata · aug live</span></div><p style={css("font-size:13.5px;color:#8a8a8a;margin:0 0 16px")}>Vier thema&apos;s, vier metingen. De richting van de lijn zegt meer dan de losse score.</p> {B.orgChart}</div>
                      <div style={css("display:flex;flex-direction:column;gap:12px;padding-top:8px")}>
                        {B.legenda.map((l: any, lI: number) => (
                          <Fragment key={lI}>
                            <div style={css("display:flex;gap:10px;align-items:flex-start")}>
                              <span style={css(`width:12px;height:3px;border-radius:200px;background:${l.kleur};display:inline-block;margin-top:8px;flex:none`)} />
                              <div style={css("min-width:0")}>
                                <div style={css("font-size:13.5px;font-weight:600;line-height:1.35")}>{l.naam}</div>
                                <div style={css(`font-size:12px;color:${l.bewegingKleur}`)}>{l.nu} · {l.beweging}</div>
                              </div>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={css("margin-bottom:22px")}>
                    <div style={css("display:flex;justify-content:flex-end;gap:6px;margin-bottom:8px")}>
                      <button onClick={B.beeld.orgVerbeterN} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG</button>
                      <button onClick={B.beeld.orgVerbeterA} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG anoniem</button>
                    </div>
                    <div data-export="orgVerbeter" style={css("background:#fff;border:1px solid #e8e6e2;border-radius:5px;padding:22px 24px 24px")}>
                      <div style={css("display:flex;align-items:baseline;gap:10px;margin-bottom:4px")}>
                        <div style={css("font-size:17px;font-weight:600")}>Verbeterpunten · wat je anders kunt doen</div>
                        <span style={css("font-family:var(--font-plex-mono),monospace;font-size:11px;color:#7a7a7a")}>gesorteerd op laagste score</span>
                      </div>
                      <p style={css("font-size:13.5px;color:#8a8a8a;margin:0 0 18px")}>Vier thema&apos;s, vier concrete stappen. Wat bovenaan staat, kost deze maand de meeste aandacht.</p>
                      <div style={css("display:flex;flex-direction:column;gap:10px")}>
                        {B.orgAdvies.map((a: any, aI: number) => (
                          <Fragment key={aI}>
                            <div style={css("border-top:1px solid #f0eeea;padding-top:12px")}>
                              <div style={css("display:flex;gap:14px;align-items:flex-start")}>
                                <span style={css("font-family:var(--font-plex-mono),monospace;font-size:11px;color:#b0b0b0;padding-top:3px")}>{a.rang}</span>
                                <div style={css("flex:none;width:auto;display:flex;align-items:center;gap:8px;min-width:190px;padding-top:1px")}>
                                  <span style={css(`width:9px;height:9px;border-radius:2px;background:${a.kleur};display:inline-block`)} />
                                  <span style={css("font-size:14.5px;font-weight:600")}>{a.naam}</span>
                                  <span style={css("font-family:var(--font-plex-mono),monospace;font-size:12px;color:#5c5c5c")}>{a.score}</span>
                                </div>
                                <span style={css(a.niveauStyle)}>{a.niveau}</span>
                                <div style={css("flex:1;display:flex;flex-direction:column;gap:9px")}>
                                  <p style={css("font-size:14.5px;line-height:1.55;margin:0;text-wrap:pretty")}>{a.advies}</p>
                                  <button onClick={a.toggleBewijs} style={css(a.bewijsStyle)}>{a.bewijsLabel}</button>
                                  {a.bewijsOpen ? (
                                    <>
                                      <div style={css("background:#faf9f6;border:1px solid #eceae6;border-radius:5px;padding:16px 18px;animation:rise .2s ease both")}>
                                        <p style={css("font-size:13px;color:#7a7a7a;margin:0 0 12px;line-height:1.5")}>{a.bewijsUitleg}</p>
                                        <div style={css("display:flex;flex-direction:column;gap:2px")}>
                                          {a.bewijsRegels.map((b: any, bI: number) => (
                                            <Fragment key={bI}>
                                              <div style={css("display:flex;align-items:center;gap:12px;border-top:1px solid #f0eeea;padding:8px 0")}>
                                                <span style={css("flex:1;font-size:14px;line-height:1.45;text-wrap:pretty")}>{b.vraag}</span>
                                                <span style={css("font-size:12px;color:#9a9a9a;flex:none")}>{b.wie}</span>
                                                <span style={css(b.scoreStyle)}>{b.score}/5</span>
                                              </div>
                                            </Fragment>
                                          ))}
                                        </div>
                                        <div style={css("display:flex;flex-direction:column;gap:10px;margin-top:14px")}>
                                          {a.bewijsQuotes.map((q: any, qI: number) => (
                                            <Fragment key={qI}>
                                              <div style={css("border-left:2px solid #27CFC3;padding:2px 0 2px 12px")}>
                                                <p style={css("font-size:14px;line-height:1.55;margin:0 0 4px;font-style:italic;text-wrap:pretty")}>“{q.tekst}”</p>
                                                <span style={css("font-size:11.5px;color:#9a9a9a")}>{q.bron}</span>
                                              </div>
                                            </Fragment>
                                          ))}
                                        </div>
                                      </div>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={css("display:grid;grid-template-columns:1.25fr 1fr;gap:22px;align-items:start")}>
                    <div>
                      <div style={css("display:flex;justify-content:flex-end;gap:6px;margin-bottom:8px")}>
                        <button onClick={B.beeld.orgInzichtenN} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG</button>
                        <button onClick={B.beeld.orgInzichtenA} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG anoniem</button>
                      </div>
                      <div data-export="orgInzichten" style={css("background:#1F1F1F;border-radius:5px;padding:26px 28px 28px")}>
                        <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:16px")}>
                          <span style={css("width:7px;height:7px;border-radius:50%;background:#F5A46C;display:inline-block")} />
                          <span style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#F5A46C")}>AI-inzichten</span>
                        </div>
                        {B.geenInzichten ? (
                          <>
                            <p style={css("color:#c9c9c9;font-size:15.5px;line-height:1.6;margin:0 0 20px;max-width:440px")}>Laat de scores, de segmentverdeling en de open antwoorden samenvatten tot drie inzichten met bewijs en een actie voor deze week.</p>
                            <button onClick={B.genereer} style={css("background:#F5A46C;color:#fff;border:none;border-radius:200px;padding:12px 24px;font-size:15px;font-weight:600;cursor:pointer")} className="hv3">{B.genereerLabel}</button>
                          </>
                        ) : null}
                        {B.heeftInzichten ? (
                          <>
                            <p style={css("color:#fff;font-size:18px;line-height:1.55;margin:0 0 22px;font-weight:500;text-wrap:pretty")}>{B.samenvatting}</p>
                            <div style={css("display:flex;flex-direction:column;gap:12px")}>
                              {B.inzichten.map((i: any, iI: number) => (
                                <Fragment key={iI}>
                                  <div style={css("background:#2a2a2a;border-radius:5px;padding:16px 18px")}>
                                    <div style={css("display:flex;align-items:center;gap:9px;margin-bottom:8px")}>
                                      <span style={css(i.urgStyle)}>{i.urgentie}</span>
                                      <span style={css("color:#fff;font-size:15.5px;font-weight:600")}>{i.kop}</span>
                                    </div>
                                    <p style={css("color:#a5a5a5;font-size:13.5px;line-height:1.55;margin:0 0 8px")}><span style={css("color:#7fd6d0")}>Bewijs ·</span>{i.bewijs}</p>
                                    <p style={css("color:#e4e4e4;font-size:13.5px;line-height:1.55;margin:0")}><span style={css("color:#F5A46C")}>Actie ·</span>{i.actie}</p>
                                  </div>
                                </Fragment>
                              ))}
                            </div>
                            {B.heeftCitaat ? (
                              <>
                                <div style={css("border-left:2px solid #F5A46C;padding:4px 0 4px 16px;margin-top:20px")}>
                                  <div style={css("font-family:var(--font-plex-mono),monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#F5A46C;margin-bottom:6px")}>Opvallend citaat</div>
                                  <p style={css("color:#fff;font-size:16px;line-height:1.55;margin:0;font-style:italic;text-wrap:pretty")}>“{B.citaat}”</p>
                                </div>
                              </>
                            ) : null}
                            <p style={css("color:#8a8a8a;font-size:12.5px;line-height:1.55;margin:18px 0 0")}>{B.nDisclaimer}</p>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <div style={css("margin-bottom:14px")}>
                        <div style={css("display:flex;justify-content:flex-end;gap:6px;margin-bottom:8px")}>
                          <button onClick={B.beeld.orgOpenN} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG</button>
                          <button onClick={B.beeld.orgOpenA} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG anoniem</button>
                        </div>
                        <div data-export="orgOpen" style={css("background:#fff;border:1px solid #e8e6e2;border-radius:5px;padding:22px 24px 24px")}>
                          <div style={css("font-size:17px;font-weight:600;margin-bottom:4px")}>Open antwoorden</div>
                          <p style={css("font-size:13px;color:#8a8a8a;margin:0 0 16px")}>{B.openTelling}</p>
                          <div style={css("display:flex;flex-direction:column;gap:12px")}>
                            {B.openAntwoorden.map((o: any, oI: number) => (
                              <Fragment key={oI}>
                                <div style={css("border-left:2px solid #27CFC3;padding:2px 0 2px 14px")}>
                                  <p style={css("font-size:14.5px;line-height:1.55;margin:0 0 5px;text-wrap:pretty")}>{o.tekst}</p>
                                  <span style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#9a9a9a")}>{o.bron}</span>
                                </div>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={css("background:#fff;border:1px solid #e8e6e2;border-radius:5px;padding:20px 24px 22px")}>
                        <div style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#7a7a7a;margin-bottom:12px")}>Privacy</div>
                        <p style={css("font-size:14px;line-height:1.6;margin:0;color:#3d3d3d;text-wrap:pretty")}>{B.privacyTekst}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
              {B.isPersoonView ? (
                <>
                  <div style={css("display:grid;grid-template-columns:250px 1fr;gap:22px;align-items:start")}>
                    <div style={css("display:flex;flex-direction:column;gap:6px")}>
                      <div style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#7a7a7a;margin-bottom:4px")}>Werknemers</div>
                      {B.personen.map((p: any, pI: number) => (
                        <Fragment key={pI}>
                          <button onClick={p.kies} style={css(p.style)}>{p.avatar}<span style={css("display:flex;flex-direction:column;align-items:flex-start;gap:1px;min-width:0")}><span style={css(p.naamStyle)}>{p.naam}</span><span style={css(p.subStyle)}>{p.sub}</span></span></button>
                        </Fragment>
                      ))}
                    </div>
                    <div>
                      <div style={css("margin-bottom:14px")}>
                        <div style={css("display:flex;justify-content:flex-end;gap:6px;margin-bottom:8px")}>
                          <button onClick={B.beeld.pThemasN} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG</button>
                          <button onClick={B.beeld.pThemasA} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG anoniem</button>
                        </div>
                        <div data-export="pThemas" style={css("background:#fff;border:1px solid #e8e6e2;border-top:3px solid #00B0A8;border-radius:5px;padding:24px 26px 26px")}>
                          <div style={css("display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:22px")}>{B.persoon.avatar} <div style={css("flex:1;min-width:200px")}><div style={css("font-size:24px;font-weight:700;letter-spacing:-.02em;line-height:1.2")}>{B.persoon.naam}</div><div style={css("font-size:13.5px;color:#8a8a8a")}>{B.persoon.segment} · {B.persoon.respons}</div></div><div style={css("text-align:right")}><div style={css("font-size:30px;font-weight:700;letter-spacing:-.03em;line-height:1")}>{B.persoon.gemiddeld}</div><div style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#7a7a7a")}>gemiddeld</div></div></div>
                          {B.persoon.geenData ? (
                            <>
                              <p style={css("font-size:15px;color:#8a8a8a;margin:0;line-height:1.55")}>Deze werknemer heeft de pulse nog niet ingevuld. Zodra het antwoord binnen is, staan hier de scores per thema.</p>
                            </>
                          ) : null}
                          {B.persoon.heeftData ? (
                            <>
                              <div style={css("display:flex;flex-direction:column;gap:14px")}>
                                {B.persoon.themas.map((t: any, tI: number) => (
                                  <Fragment key={tI}>
                                    <div style={css("border-top:1px solid #f0eeea;padding-top:13px;display:flex;gap:20px;align-items:flex-start")}>
                                      <div style={css("flex:1;min-width:0")}>
                                        <div style={css("display:flex;align-items:baseline;gap:10px;margin-bottom:8px")}>
                                          <span style={css(`width:9px;height:9px;border-radius:2px;background:${t.kleur};display:inline-block`)} />
                                          <span style={css("font-size:14.5px;font-weight:600;flex:1")}>{t.naam}</span>
                                          <span style={css(`font-family:var(--font-plex-mono),monospace;font-size:11.5px;color:${t.deltaKleur}`)}>{t.delta}</span>
                                          <span style={css("font-size:19px;font-weight:700;letter-spacing:-.02em;width:38px;text-align:right")}>{t.score}</span>
                                        </div>
                                        <div style={css("height:6px;background:#f0eeea;border-radius:200px;overflow:hidden")}>
                                          <div style={css(`height:6px;border-radius:200px;transition:width .4s ease;background:${t.kleur};width:${t.pct}%`)} />
                                        </div>
                                        <div style={css("display:flex;gap:10px;margin-top:7px;font-size:12px")}>
                                          <span style={css("color:#9a9a9a")}>Organisatie {t.org} · {t.niveau}</span>
                                          <span style={css(`color:${t.trendKleur}`)}>{t.trend}</span>
                                        </div>
                                      </div>
                                      <div style={css("flex:none;width:132px")}>
                                        <div style={css("display:flex;gap:4px;align-items:flex-end;height:46px")}>
                                          {t.reeks.map((r: any, rI: number) => (
                                            <Fragment key={rI}>
                                              <div style={css("flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:46px")}>
                                                <div style={css(r.style)} />
                                              </div>
                                            </Fragment>
                                          ))}
                                        </div>
                                        <div style={css("display:flex;gap:4px;margin-top:4px")}>
                                          {t.reeks.map((r: any, rI: number) => (
                                            <Fragment key={rI}>
                                              <span style={css("flex:1;font-family:var(--font-plex-mono),monospace;font-size:9px;color:#a8a8a8;text-align:center")}>{r.label}</span>
                                            </Fragment>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </Fragment>
                                ))}
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div style={css("margin-bottom:14px")}>
                        <div style={css("display:flex;justify-content:flex-end;gap:6px;margin-bottom:8px")}>
                          <button onClick={B.beeld.pVerloopN} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG</button>
                          <button onClick={B.beeld.pVerloopA} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG anoniem</button>
                        </div>
                        <div data-export="pVerloop" style={css("background:#fff;border:1px solid #e8e6e2;border-radius:5px;padding:22px 26px 24px")}>
                          <div style={css("display:flex;align-items:baseline;gap:10px;margin-bottom:4px")}>
                            <div style={css("font-size:17px;font-weight:600")}>Verloop per maand</div>
                            <span style={css("font-family:var(--font-plex-mono),monospace;font-size:11px;color:#7a7a7a")}>mei–juli voorbeelddata · aug live</span>
                          </div>
                          <p style={css("font-size:13.5px;color:#8a8a8a;margin:0 0 16px")}>Beweegt deze werknemer per thema vooruit of achteruit?</p>
                          {B.persoon.chart}
                          <div style={css("display:flex;flex-wrap:wrap;gap:10px 26px;margin-top:16px;border-top:1px solid #f0eeea;padding-top:14px")}>
                            {B.persoon.themas.map((t: any, tI: number) => (
                              <Fragment key={tI}>
                                <div style={css("display:flex;gap:10px;align-items:flex-start")}>
                                  <span style={css(`width:12px;height:3px;border-radius:200px;background:${t.kleur};display:inline-block;margin-top:8px;flex:none`)} />
                                  <div>
                                    <div style={css("font-size:13.5px;font-weight:600;line-height:1.35")}>{t.naam}</div>
                                    <div style={css(`font-size:12px;color:${t.trendKleur}`)}>{t.score} · {t.trend}</div>
                                  </div>
                                </div>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={css("background:#fff;border:1px solid #e8e6e2;border-top:3px solid #F5A46C;border-radius:5px;padding:22px 26px 24px;margin-bottom:14px")}>
                        <div style={css("display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px")}>
                          <div style={css("font-size:17px;font-weight:600")}>Context &amp; notities</div>
                          <span style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;background:#fbf0e7;color:#8a4b1f;padding:4px 10px;border-radius:200px")}>{B.persoon.ctxLabel}</span>
                          <span style={css("font-size:13px;color:#8a8a8a")}>{B.persoon.ctxKort}</span>
                        </div>
                        <p style={css("font-size:14.5px;line-height:1.55;margin:0 0 16px;color:#3d3d3d;text-wrap:pretty")}>{B.persoon.ctxLees}</p>
                        <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:22px")}>
                          <div>
                            <div style={css("font-family:var(--font-plex-mono),monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#7a7a7a;margin-bottom:8px")}>Wat helpt</div>
                            <div style={css("display:flex;flex-direction:column;gap:8px")}>
                              {B.persoon.ctxHelpt.map((h: any, hI: number) => (
                                <Fragment key={hI}>
                                  <div style={css("display:flex;gap:9px;align-items:flex-start")}>
                                    <span style={css("width:5px;height:5px;border-radius:50%;background:#00B0A8;display:inline-block;margin-top:8px;flex:none")} />
                                    <p style={css("font-size:14.5px;line-height:1.5;margin:0;text-wrap:pretty")}>{h.tekst}</p>
                                  </div>
                                </Fragment>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div style={css("font-family:var(--font-plex-mono),monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#7a7a7a;margin-bottom:8px")}>Valkuil</div>
                            <p style={css("font-size:14.5px;line-height:1.55;margin:0;color:#3d3d3d;text-wrap:pretty")}>{B.persoon.ctxValkuil}</p>
                            <p style={css("font-size:12px;line-height:1.5;margin:12px 0 0;color:#9a9a9a")}>Vrijwillig gedeeld, niet in de export en niet zichtbaar voor collega&apos;s.</p>
                          </div>
                        </div>
                        <div style={css("border-top:1px solid #f0eeea;margin-top:20px;padding-top:16px")}>
                          <div style={css("font-family:var(--font-plex-mono),monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#7a7a7a;margin-bottom:12px")}>Notities</div>
                          <div style={css("display:flex;flex-direction:column;gap:8px;margin-bottom:14px")}>
                            {B.persoon.notities.map((n: any, nI: number) => (
                              <Fragment key={nI}>
                                <div style={css("display:flex;gap:12px;align-items:flex-start;background:#faf9f6;border-radius:5px;padding:11px 14px")}>
                                  <span style={css("font-family:var(--font-plex-mono),monospace;font-size:11px;color:#a8a8a8;padding-top:3px;flex:none")}>{n.datum}</span>
                                  <p style={css("flex:1;font-size:14.5px;line-height:1.5;margin:0;text-wrap:pretty")}>{n.tekst}</p>
                                  <button onClick={n.verwijder} style={css("border:none;background:transparent;cursor:pointer;font-size:15px;color:#b0b0b0;font-family:inherit;line-height:1;padding:2px 4px")} className="hv4">×</button>
                                </div>
                              </Fragment>
                            ))}
                          </div>
                          {B.persoon.geenNotities ? (
                            <>
                              <p style={css("font-size:13.5px;color:#9a9a9a;margin:0 0 14px")}>Nog geen notities. Leg hier afspraken vast die bij de volgende pulse relevant zijn.</p>
                            </>
                          ) : null}
                          <div style={css("display:flex;gap:8px;align-items:flex-start")}>
                            <textarea value={B.nieuweNotitie} onChange={B.setNotitie} rows={2} placeholder="Bijvoorbeeld: afspraak uit het gesprek van deze week…" style={css("flex:1;border:1px solid #dcdad6;background:transparent;border-radius:0;padding:9px 11px;font-size:14.5px;line-height:1.5;resize:vertical")} />
                            <button onClick={B.bewaarNotitie} style={css(B.bewaarStyle)}>Bewaar</button>
                          </div>
                        </div>
                      </div>
                      <div style={css("margin-bottom:14px")}>
                        <div style={css("display:flex;justify-content:flex-end;gap:6px;margin-bottom:8px")}>
                          <button onClick={B.beeld.pAntwoordenN} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG</button>
                          <button onClick={B.beeld.pAntwoordenA} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG anoniem</button>
                        </div>
                        <div data-export="pAntwoorden" style={css("background:#fff;border:1px solid #e8e6e2;border-radius:5px;padding:22px 24px 24px")}>
                          <div style={css("display:flex;align-items:baseline;gap:10px;margin-bottom:14px")}>
                            <div style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#7a7a7a")}>Gegeven antwoorden</div>
                            <span style={css("font-size:12.5px;color:#a8a8a8")}>de vragen zoals deze werknemer ze kreeg</span>
                          </div>
                          <div style={css("display:flex;flex-direction:column;gap:2px")}>
                            {B.persoon.antwoorden.map((a: any, aI: number) => (
                              <Fragment key={aI}>
                                <div style={css("display:flex;align-items:center;gap:12px;border-top:1px solid #f4f2ee;padding:9px 0")}>
                                  <span style={css(`width:8px;height:8px;border-radius:2px;background:${a.kleur};display:inline-block;flex:none`)} />
                                  <span style={css("flex:1;font-size:14.5px;line-height:1.45;text-wrap:pretty")}>{a.vraag}</span>
                                  <span style={css("font-family:var(--font-plex-mono),monospace;font-size:10px;color:#c0c0c0")}>{a.id}</span>
                                  <span style={css(a.scoreStyle)}>{a.score}/5</span>
                                </div>
                              </Fragment>
                            ))}
                          </div>
                          {B.persoon.geenData ? (
                            <>
                              <p style={css("font-size:14px;color:#9a9a9a;margin:0")}>Nog geen antwoorden binnen.</p>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:14px")}>
                        <div style={css("background:#fff;border:1px solid #e8e6e2;border-radius:5px;padding:22px 24px 24px")}>
                          <div style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#7a7a7a;margin-bottom:14px")}>In eigen woorden</div>
                          {B.persoon.quotes.map((q: any, qI: number) => (
                            <Fragment key={qI}>
                              <div style={css("border-left:2px solid #27CFC3;padding:2px 0 2px 14px;margin-bottom:12px")}>
                                <p style={css("font-size:15.5px;line-height:1.55;margin:0;font-style:italic;text-wrap:pretty")}>“{q.tekst}”</p>
                              </div>
                            </Fragment>
                          ))}
                          {B.persoon.geenQuote ? (
                            <>
                              <p style={css("font-size:14px;color:#9a9a9a;margin:0")}>Geen open antwoord bij deze pulse.</p>
                            </>
                          ) : null}
                        </div>
                        <div>
                          <div style={css("display:flex;justify-content:flex-end;gap:6px;margin-bottom:8px")}>
                            <button onClick={B.beeld.pAdviesN} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG</button>
                            <button onClick={B.beeld.pAdviesA} style={css("cursor:pointer;border:1px solid #dcdad6;background:#fff;border-radius:200px;padding:4px 11px;font-size:11.5px;font-weight:500;color:#5c5c5c;font-family:inherit")} className="hv2">PNG anoniem</button>
                          </div>
                          <div data-export="pAdvies" style={css("background:#1F1F1F;border-radius:5px;padding:22px 24px 24px")}>
                            <div style={css("display:flex;align-items:center;gap:9px;margin-bottom:14px")}>
                              <span style={css("width:7px;height:7px;border-radius:50%;background:#F5A46C;display:inline-block")} />
                              <span style={css("font-family:var(--font-plex-mono),monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#F5A46C")}>Advies</span>
                            </div>
                            <div style={css("margin-bottom:16px")}>
                              <div style={css("color:#7fd6d0;font-size:12.5px;margin-bottom:4px")}>Focus · {B.persoon.focusThema}</div>
                              <p style={css("color:#fff;font-size:14.5px;line-height:1.55;margin:0;text-wrap:pretty")}>{B.persoon.focusAdvies}</p>
                            </div>
                            <div>
                              <div style={css("color:#7fd6d0;font-size:12.5px;margin-bottom:4px")}>Kracht · {B.persoon.krachtThema}</div>
                              <p style={css("color:#c9c9c9;font-size:14.5px;line-height:1.55;margin:0;text-wrap:pretty")}>{B.persoon.krachtAdvies}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
