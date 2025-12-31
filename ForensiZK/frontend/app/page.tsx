"use client";

import React, { useEffect, useState, useRef } from "react";
import { Upload, ShieldCheck, RefreshCcw, Moon, Sun, Download, Key } from "lucide-react";

/* ----------------------------- helper: getApiBase --------------------------- */
function getApiBase(): string {
  if (typeof window !== 'undefined' && (window as any).__ENV && (window as any).__ENV.NEXT_PUBLIC_API_BASE) {
    return (window as any).__ENV.NEXT_PUBLIC_API_BASE;
  }
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE as string;
  }
  return '';
}

/* ------------------------------- UI primitives ----------------------------- */
function Button({ children, variant = 'primary', className = '', ...rest }: any) {
  const base = 'inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold transition-all duration-200 shadow-sm';
  const variants: Record<string, string> = {
    primary: 'bg-gradient-to-r from-[#00f0ff]/20 via-[#6c5aff]/20 to-[#00f0ff]/10 border border-transparent hover:scale-[1.02] shadow-[0_6px_24px_rgba(108,90,255,0.12)]',
    solid: 'bg-[#6C5AFF] text-white hover:brightness-110',
    ghost: 'bg-transparent border border-white/6 hover:bg-white/3',
  };
  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...rest}>
      {children}
    </button>
  );
}

function Card({ children, className = '' }: any) {
  return (
    <div className={`rounded-2xl p-4 backdrop-blur-sm bg-gradient-to-br from-white/3 to-black/10 border border-white/6 shadow-md ${className}`}>
      {children}
    </div>
  );
}

function IconButton({ onClick, children, title }: any) {
  return (
    <button onClick={onClick} title={title} className="p-2 rounded-md hover:scale-105 transition-transform bg-white/3">
      {children}
    </button>
  );
}

/* ------------------------------- Subcomponents ---------------------------- */
function Header({ user, onSignIn, onSignOut, dark, setDark }: any) {
  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#6C5AFF] to-[#00F0FF] flex items-center justify-center text-black font-bold">ZK</div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">ForensiZK</h1>
          <div className="text-xs text-zinc-400">PLONK-backed log integrity & forensic proofs</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-zinc-300 mr-2">{user ? `Signed in: ${user.username || user.email}` : 'Not signed in'}</div>

        {!user ? (
          <Button variant="solid" className="flex items-center gap-2" onClick={onSignIn}>
            <Key className="w-4 h-4" /> Sign in
          </Button>
        ) : (
          <Button variant="ghost" onClick={onSignOut}>Sign out</Button>
        )}

        <IconButton onClick={() => setDark(!dark)} title="Toggle theme">
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </IconButton>
      </div>
    </header>
  );
}

function Tabs({ active, setActive }: { active: string; setActive: (t: any) => void }) {
  const tabs = [
    { id: 'analyze', label: 'Analyze' },
    { id: 'verify', label: 'Verify' },
    { id: 'settings', label: 'Settings' },
  ];
  return (
    <nav className="flex gap-2 mb-6">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => setActive(t.id)} className={`px-4 py-2 rounded-lg ${active===t.id ? 'bg-gradient-to-r from-[#6C5AFF] to-[#00F0FF] text-black shadow-lg' : 'bg-white/5 hover:bg-white/7'}`}>
          {t.label}
        </button>
      ))}
    </nav>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-white/6 rounded-full h-3 overflow-hidden">
      <div style={{ width: `${progress}%` }} className="h-3 bg-gradient-to-r from-[#00F0FF] to-[#6C5AFF] transition-all duration-500"></div>
    </div>
  );
}

/* ----------------------------- Analyze Panel ------------------------------- */
// function AnalyzePanel(props: any) {
//   const { file, setFile, uploadAndProve, progress, loading, merkleRoot, verdict, proofBlobUrl, downloadProof, logs } = props;
//   const filename = proofBlobUrl ? proofBlobUrl.split('/').pop() : null;
//   return (
//     <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//       <Card className="p-6">
//         <div className="flex flex-col gap-4">
//           <label className="group flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer bg-gradient-to-b from-white/3 to-black/6 hover:from-white/5 hover:scale-[1.01] transition-all">
//             <Upload className="w-12 h-12 opacity-80 group-hover:animate-bounce" />
//             <span className="mt-3 text-sm font-medium">Upload Log File (JSON / plain text)</span>
//             <input className="hidden" type="file" onChange={(e)=> setFile(e.target.files?.[0]||null)} />
//           </label>

//           {file && <div className="text-sm">Selected: <strong className="font-mono">{file.name}</strong> — {(file.size/1024).toFixed(1)} KB</div>}

//           <div className="grid gap-3">
//             <Button onClick={uploadAndProve} disabled={!file || loading} className="w-full">
//               {loading ? (
//                 <div className="flex items-center gap-2"><RefreshCcw className="animate-spin"/> Processing</div>
//               ) : (
//                 <div className="flex items-center gap-2"><ShieldCheck/> Run ZK Analysis</div>
//               )}
//             </Button>

//             <div>
//               <ProgressBar progress={progress} />
//               <div className="text-xs text-zinc-400 mt-2">Progress: {progress}%</div>
//             </div>

//             {merkleRoot && (
//               <div className="mt-2 p-3 rounded bg-white/3">
//                 <div className="text-xs text-zinc-300">Merkle Root</div>
//                 <div className="font-mono break-all text-sm">{merkleRoot}</div>
//               </div>
//             )}

//             {verdict && (
//               <div className="mt-2 p-3 rounded bg-white/3">
//                 <div className="text-sm font-semibold">
//                   Verdict:
//                   <span className={`ml-2 ${verdict.compromised ? 'text-rose-400' : 'text-emerald-300'}`}>
//                     {verdict.compromised ? 'Compromised' : 'Clean'}
//                   </span>
//                 </div>
//                 <div className="text-xs text-zinc-400 mt-1">
//                   Reason: {verdict.reason || JSON.stringify(verdict)}
//                 </div>
//               </div>
//             )}

//             <div className="flex gap-2">
//               <Button onClick={downloadProof} disabled={!proofBlobUrl}><Download/> Download Proof</Button>
//               <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(merkleRoot || ""); }} disabled={!merkleRoot}>
//                 Copy Root
//               </Button>
//             </div>
//           </div>
//         </div>
//       </Card>

//       <Card className="p-6">
//         <h3 className="font-semibold">Proof Artifacts</h3>
//         <div className="mt-3 text-sm text-zinc-400">When proof generation finishes you'll see download links and public outputs here.</div>

//         {proofBlobUrl ? (
//           <div className="mt-4 flex items-center justify-between">
//             <div className="font-mono truncate max-w-[60%]">{filename}</div>
//             <Button onClick={downloadProof}>Download</Button>
//             <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(proofBlobUrl || ""); }}>
//               Copy Link
//             </Button>
//           </div>
//         ) : (
//           <div className="mt-4 text-sm text-zinc-400">No proof yet.</div>
//         )}

//         <div className="mt-6">
//           <h4 className="font-medium">Live Logs</h4>
//           <pre className="mt-2 text-xs bg-black/5 p-3 rounded h-48 overflow-auto">
//             {logs.length === 0
//               ? '[task] awaiting input...\n[task] uploaded file queued\n[task] building witness...'
//               : logs.join("\n")}
//           </pre>
//         </div>
//       </Card>
//     </main>
//   );
// }

function AnalyzePanel(props: any) {
  const {
    file,
    setFile,
    uploadAndProve,
    progress,
    loading,
    merkleRoot,
    verdict,
    proofBlobUrl,
    downloadProof,
    logs
  } = props;

  const filename = proofBlobUrl ? proofBlobUrl.split('/').pop() : null;

  return (
    <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* LEFT PANEL */}
      <Card className="p-6">
        <div className="flex flex-col gap-5">

          {/* Upload */}
          <label className="group flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer bg-gradient-to-b from-white/3 to-black/6 hover:from-white/5 transition-all">
            <Upload className="w-12 h-12 opacity-80 group-hover:animate-bounce" />
            <span className="mt-3 text-sm font-medium">
              Upload Log File (JSON / plain text)
            </span>
            <input
              className="hidden"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          {file && (
            <div className="text-sm">
              Selected: <strong className="font-mono">{file.name}</strong> —{" "}
              {(file.size / 1024).toFixed(1)} KB
            </div>
          )}

          {/* ACTION BLOCK — THIS IS THE IMPORTANT PART */}
          <div className="flex flex-col gap-3">

            {/* Run Button */}
            <Button
              onClick={uploadAndProve}
              disabled={!file || loading}
              className="w-full"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCcw className="animate-spin" />
                  Processing
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ShieldCheck />
                  Run ZK Analysis
                </div>
              )}
            </Button>

            {/* Progress */}
            <div>
              <ProgressBar progress={progress} />
              <div className="text-xs text-zinc-400 mt-1">
                Progress: {progress}%
              </div>
            </div>

            {/* Verdict — NOW ALIGNED WITH BUTTON + PROGRESS */}
            {verdict && (
              <div className="rounded-xl border border-white/10 bg-white/3 p-3">
                <div className="text-sm font-semibold">
                  Verdict:
                  <span
                    className={`ml-2 ${
                      verdict.compromised
                        ? "text-rose-400"
                        : "text-emerald-300"
                    }`}
                  >
                    {verdict.compromised ? "Compromised" : "Clean"}
                  </span>
                </div>

                <pre className="text-xs text-zinc-400 mt-2 whitespace-pre-wrap break-all">
{JSON.stringify(verdict.reason ?? verdict, null, 2)}
                </pre>
              </div>
            )}

            {/* Merkle Root */}
            {merkleRoot && (
              <div className="rounded bg-white/3 p-3">
                <div className="text-xs text-zinc-300">Merkle Root</div>
                <div className="font-mono text-sm break-all">
                  {merkleRoot}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={downloadProof} disabled={!proofBlobUrl}>
                <Download />
                Download Proof
              </Button>

              <Button
                variant="ghost"
                disabled={!merkleRoot}
                onClick={() =>
                  navigator.clipboard.writeText(merkleRoot || "")
                }
              >
                Copy Root
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* RIGHT PANEL — LIVE LOGS */}
      <Card className="p-6">
        <h3 className="font-semibold">Proof Artifacts</h3>

        <div className="mt-3 text-sm text-zinc-400">
          When proof generation finishes you'll see outputs here.
        </div>

        {proofBlobUrl ? (
          <div className="mt-4 flex items-center justify-between">
            <div className="font-mono truncate max-w-[60%]">
              {filename}
            </div>
            <Button onClick={downloadProof}>Download</Button>
          </div>
        ) : (
          <div className="mt-4 text-sm text-zinc-400">
            No proof yet.
          </div>
        )}

        <div className="mt-6">
          <h4 className="font-medium">Live Logs</h4>
          <pre className="mt-2 text-xs bg-black/5 p-3 rounded h-48 overflow-auto">
            {logs.length === 0
              ? "[task] awaiting input...\n[task] uploaded file queued\n[task] building witness..."
              : logs.join("\n")}
          </pre>
        </div>
      </Card>
    </main>
  );
}


/* ------------------------------- Verify Panel ------------------------- */
function VerifyPanel({ verifyFile, setVerifyFile, verifyPublicInput, setVerifyPublicInput, runVerify, verifyResult }: any) {
  return (
    <main>
      <Card className="p-6">
        <div className="grid gap-3">
          <h3 className="font-semibold">Verify an External Proof</h3>

          <input type="file" onChange={(e)=> setVerifyFile(e.target.files?.[0]||null)} />

          <textarea
            placeholder='Public inputs JSON (optional) — e.g. {"merkle_root":"..."}'
            value={verifyPublicInput}
            onChange={(e)=> setVerifyPublicInput(e.target.value)}
            className="w-full h-32 p-2 rounded bg-white/3"
          />

          <div className="flex gap-2">
            <Button onClick={runVerify}>Run Verify</Button>
            <Button variant="ghost" onClick={()=>{ setVerifyFile(null); setVerifyPublicInput(''); }}>Reset</Button>
          </div>

          {verifyResult && (
            <div className="mt-3 p-3 rounded bg-white/3">
              <div className="text-sm font-medium">Result</div>
              <pre className="text-xs mt-2">{JSON.stringify(verifyResult, null, 2)}</pre>
            </div>
          )}
        </div>
      </Card>
    </main>
  );
}

/* ----------------------------- NEW SETTINGS PANEL -------------------------- */
function SettingsPanel() {
  return (
    <main className="grid grid-cols-1 lg:grid-cols-1 gap-6">
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Settings</h3>

        <div className="grid gap-4 text-sm">

          <div className="p-3 rounded-xl bg-white/3 border border-white/10">
            <div className="font-medium text-zinc-300">API Base URL</div>
            <div className="text-xs text-zinc-400 mt-1">
              Controlled via <span className="font-mono">NEXT_PUBLIC_API_BASE</span>.
              Modify <span className="font-mono">.env.local</span> to point to your backend.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/3 border border-white/10">
            <div className="font-medium text-zinc-300">Authentication</div>
            <div className="text-xs text-zinc-400 mt-1">
              Uses OPAQUE passwordless authentication handled entirely by the backend.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/3 border border-white/10">
            <div className="font-medium text-zinc-300">Upload Strategy</div>
            <div className="text-xs text-zinc-400 mt-1">
              For large logs, prefer presigned uploads. Submit references to 
              <span className="font-mono"> /api/prove </span> instead of raw files.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/3 border border-white/10">
            <div className="font-medium text-zinc-300">Proof Storage</div>
            <div className="text-xs text-zinc-400 mt-1">
              Proofs may be returned inline (base64) or via download links depending on backend configuration.
            </div>
          </div>

        </div>
      </Card>
    </main>
  );
}

/* ------------------------------- Main Export -------------------------------- */
export default function ZKForensicsDashboard() {
  // state
  const [file, setFile] = useState<File | null>(null);
  const [proofBlobUrl, setProofBlobUrl] = useState<string | null>(null);
  const [merkleRoot, setMerkleRoot] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<any>(null);

  // progress: synthetic + real mix
  const [progress, setProgress] = useState<number>(0);
  const progressRef = useRef<number>(0);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'analyze'|'verify'|'settings'>('analyze');
  const [dark, setDark] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyPublicInput, setVerifyPublicInput] = useState<string>('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // logs for live output
  const [logs, setLogs] = useState<string[]>([]);
  const logsRef = useRef<string[]>([]);

  // synthetic progress timer
  const synthTimerRef = useRef<number | null>(null);
  const synthStartRef = useRef<number | null>(null);
  const synthDuration = 45_000;

  // api base
  const [apiBase, setApiBase] = useState<string | null>(null);
  useEffect(() => { setApiBase(getApiBase()); }, []);

  // dark mode
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  // session check
  useEffect(() => {
    if (apiBase === null) return;
    fetch(apiBase ? `${apiBase}/api/auth/session` : `/api/auth/session`, { credentials: 'include' })
      .then(async res => {
        if (res.ok) {
          const j = await res.json();
          setUser(j.user || j);
        }
      }).catch(() => {});
  }, [apiBase]);

  /* ---------------- synthetic progress helpers ---------------- */
  function startSyntheticProgress() {
    stopSyntheticProgress();
    progressRef.current = 10;
    setProgress(10);

    pushLog('[task] awaiting input...');
    pushLog('[task] uploaded file queued');
    pushLog('[task] building witness...');

    synthStartRef.current = Date.now();
    const start = synthStartRef.current;
    const targetStart = 10;
    const targetEnd = 90;

    synthTimerRef.current = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.max(0, now - (start || now));
      const t = Math.min(1, elapsed / synthDuration);

      const eased = 1 - Math.pow(1 - t, 0.75);
      const value = Math.floor(targetStart + (targetEnd - targetStart) * eased);

      if (value > progressRef.current) {
        progressRef.current = value;
        setProgress(value);
      }

      if (value >= targetEnd) stopSyntheticProgress();
    }, 800);
  }

  function stopSyntheticProgress() {
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
      synthStartRef.current = null;
    }
  }

  function pushLog(line: string) {
    logsRef.current = [...logsRef.current, line];
    setLogs(logsRef.current.slice());
  }

  /* ---------------- websocket + progress ---------------- */
  function openWs(wsUrl: string) {
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);

          if (data.log)
            pushLog(`[prover] ${String(data.log).trim()}`);

          if (typeof data.progress === 'number') {
            if (synthTimerRef.current) stopSyntheticProgress();
            progressRef.current = data.progress;
            setProgress(data.progress);
            pushLog(`[progress] ${data.progress}%`);
          }

          if (data.event === 'done') {
            if (data.merkle_root) setMerkleRoot(data.merkle_root);
            if (data.verdict) setVerdict(data.verdict);

            if (data.proof_blob) {
              const bin = atob(data.proof_blob);
              const len = bin.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
              const blob = new Blob([bytes], { type: 'application/octet-stream' });
              const url = URL.createObjectURL(blob);
              setProofBlobUrl(url);
            } else if (data.proof_download_url) {
              setProofBlobUrl(data.proof_download_url);
            }

            progressRef.current = 100;
            setProgress(100);
            pushLog('[task] prover finished');
            setLoading(false);
            stopSyntheticProgress();
          }

          if (data.event === 'error') {
            pushLog('[task] prover errored');
            setLoading(false);
            stopSyntheticProgress();
          }

        } catch (e) {
          console.warn('Invalid WS message', e);
        }
      };

      ws.onopen = () => pushLog('[ws] connected to progress socket');
      ws.onclose = () => pushLog('[ws] progress socket closed');
      ws.onerror = () => pushLog('[ws] progress socket error');

    } catch (e) {}
  }

  function connectProgressSocket(proofId: string) {
    const base = apiBase || '';
    const schemeReplaced = base.replace(/^http/, 'ws');
    const wsUrl = base
      ? `${schemeReplaced}/ws/progress?proofId=${encodeURIComponent(proofId)}`
      : `/ws/progress?proofId=${encodeURIComponent(proofId)}`;
    openWs(wsUrl);
  }

  /* ---------------- upload flow ---------------- */
  async function uploadAndProve() {
    if (!file) return;

    setLoading(true);
    setProgress(0);
    setMerkleRoot(null);
    setVerdict(null);
    setProofBlobUrl(null);
    setLogs([]);
    logsRef.current = [];

    startSyntheticProgress();

    const form = new FormData();
    form.append('logfile', file);

    const proveUrl = apiBase ? `${apiBase}/api/prove` : `/api/prove`;
    const res = await fetch(proveUrl, {
      method: 'POST',
      body: form,
      credentials: 'include'
    });

    if (!res.ok) {
      setLoading(false);
      stopSyntheticProgress();
      const txt = await res.text();
      alert('Upload failed: ' + txt);
      return;
    }

    const j = await res.json();
    const proofId = j.proof_id;

    pushLog(`[task] uploaded file queued (proofId=${proofId})`);
    connectProgressSocket(proofId);

    const statusUrl = apiBase ? `${apiBase}/api/prove/status` : `/api/prove/status`;

    const poll = setInterval(async () => {
      try {
        const statusRes = await fetch(`${statusUrl}?proof_id=${encodeURIComponent(proofId)}`, { credentials: 'include' });
        if (statusRes.ok) {
          const s = await statusRes.json();

          if (typeof s.progress === 'number') {
            if (s.progress > progressRef.current) {
              progressRef.current = s.progress;
              setProgress(s.progress);
              pushLog(`[status poll] ${s.progress}%`);
            }
          }

          if (s.status === 'done') {
            clearInterval(poll);
            setLoading(false);
            setMerkleRoot(s.merkle_root || null);
            try { setVerdict(s.verdict ? JSON.parse(s.verdict) : null); }
            catch { setVerdict(s.verdict || null); }
            if (s.proof_download_url) setProofBlobUrl(s.proof_download_url);

            progressRef.current = 100;
            setProgress(100);
            pushLog('[task] prover finished (polled)');
            stopSyntheticProgress();
          }

          if (s.status === 'error') {
            clearInterval(poll);
            setLoading(false);
            pushLog('[task] prover errored (polled)');
            stopSyntheticProgress();
            alert('Proof generation failed: ' + (s.error || 'unknown'));
          }
        }
      } catch (err) {}
    }, 2000);
  }

  async function downloadProof() {
    if (!proofBlobUrl) return;
    const a = document.createElement('a');
    a.href = proofBlobUrl;
    a.download = `zk_proof_${Date.now()}.bin`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function runVerify() {
    if (!verifyFile) return alert('Choose a proof file');

    const f = new FormData();
    f.append('proof', verifyFile);
    f.append('public_input', verifyPublicInput);

    const verifyUrl = apiBase ? `${apiBase}/api/verify` : `/api/verify`;
    const res = await fetch(verifyUrl, { method: 'POST', body: f, credentials: 'include' });

    if (!res.ok) {
      const t = await res.text();
      alert('Verify failed: ' + t);
      return;
    }

    const j = await res.json();
    setVerifyResult(j);
  }

  async function authenticateWithOpaque() {
    const startUrl = apiBase ? `${apiBase}/api/auth/opaque/start` : `/api/auth/opaque/start`;
    const w = window.open(startUrl, 'OPAQUE', 'width=600,height=700');
    if (!w) return alert('Please allow popups for authentication');

    const poll = setInterval(async () => {
      try {
        const r = await fetch(apiBase ? `${apiBase}/api/auth/session` : `/api/auth/session`, { credentials: 'include' });
        if (r.ok) {
          const j = await r.json();
          if (j.user) {
            setUser(j.user);
            clearInterval(poll);
            if (w) w.close();
          }
        }
      } catch {}
    }, 1000);
  }

  return (
    <div className={`min-h-screen ${dark ? 'bg-gradient-to-b from-black via-zinc-900 to-zinc-800 text-white' : 'bg-gray-50 text-zinc-900'} p-6 transition-colors`}>
      <div className="max-w-6xl mx-auto">

        <Header
          user={user}
          onSignIn={authenticateWithOpaque}
          onSignOut={() => {
            setUser(null);
            fetch(apiBase ? `${apiBase}/api/auth/logout` : `/api/auth/logout`, {
              method: 'POST',
              credentials: 'include'
            });
          }}
          dark={dark}
          setDark={setDark}
        />

        <Tabs active={activeTab} setActive={setActiveTab} />

        {activeTab === 'analyze' && (
          <AnalyzePanel
            file={file}
            setFile={setFile}
            uploadAndProve={uploadAndProve}
            progress={progress}
            loading={loading}
            merkleRoot={merkleRoot}
            verdict={verdict}
            proofBlobUrl={proofBlobUrl}
            downloadProof={downloadProof}
            logs={logs}
          />
        )}

        {activeTab === 'verify' && (
          <VerifyPanel
            verifyFile={verifyFile}
            setVerifyFile={setVerifyFile}
            verifyPublicInput={verifyPublicInput}
            setVerifyPublicInput={setVerifyPublicInput}
            runVerify={runVerify}
            verifyResult={verifyResult}
          />
        )}

        {activeTab === 'settings' && <SettingsPanel />}

        <footer className="mt-8 text-xs text-zinc-500">© ForensiZK — PLONK forensics prototype</footer>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap');
        :root {
          --neon: 0 10px 30px rgba(0,240,255,0.08);
        }
        html, body { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace; }
        .backdrop-blur-sm { backdrop-filter: blur(6px); }
        .bg-white\/3 { background-color: rgba(255,255,255,0.03); }
        .bg-white\/5 { background-color: rgba(255,255,255,0.05); }
        .bg-white\/6 { background-color: rgba(255,255,255,0.06); }
        .animate-bounce { animation: bounce 1s infinite; }
        @keyframes bounce { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-6px) } }
      `}</style>
    </div>
  );
}
