"use client";

import { FormEvent, useMemo, useState } from "react";
import { createMarketOnchain, isOnchainDeploymentConfigured, type CreateMarketResult } from "../../lib/contracts/factory";

const categories = ["Politics", "Crypto", "Economy", "Sports", "Technology", "Culture"];
type SubmitState = { status: "idle" | "submitting" | "success" | "error"; message?: string; result?: CreateMarketResult };
type CreateMarketFormProps = { adminAddress: string };

const inputClass = "mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block text-[11px] font-extrabold tracking-wide text-slate-700">{label}{children}{hint && <span className="mt-2 block text-xs font-normal tracking-normal text-slate-500">{hint}</span>}</label>;
}

function Card({ step, title, description, children }: { step: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><header className="mb-6 flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 font-mono text-[10px] font-bold text-blue-600">{step}</span><div><h2 className="font-bold tracking-[-0.03em] text-slate-950">{title}</h2><p className="mt-0.5 text-xs text-slate-500">{description}</p></div></header>{children}</section>;
}

export function CreateMarketForm({ adminAddress }: CreateMarketFormProps) {
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("Crypto");
  const [description, setDescription] = useState("");
  const [resolutionSource, setResolutionSource] = useState("");
  const [resolutionCriteria, setResolutionCriteria] = useState("");
  const [tradingClosesAt, setTradingClosesAt] = useState("");
  const [resolutionDeadline, setResolutionDeadline] = useState("");
  const [initialLiquidity, setInitialLiquidity] = useState("1000");
  const [featured, setFeatured] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const closeDate = useMemo(() => tradingClosesAt ? new Date(tradingClosesAt) : null, [tradingClosesAt]);
  const deadlineDate = useMemo(() => resolutionDeadline ? new Date(resolutionDeadline) : null, [resolutionDeadline]);
  const deploymentConfigured = isOnchainDeploymentConfigured();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deploymentConfigured) {
      setSubmitState({ status: "error", message: "Market contract is not configured yet. Add NEXT_PUBLIC_MARKET_FACTORY_ADDRESS and NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS to .env.local, then restart the dev server." });
      return;
    }
    if (!closeDate || !deadlineDate || Number.isNaN(closeDate.getTime()) || Number.isNaN(deadlineDate.getTime())) {
      setSubmitState({ status: "error", message: "Add valid trading-close and resolution-deadline dates." });
      return;
    }
    if (deadlineDate < closeDate) {
      setSubmitState({ status: "error", message: "The resolution deadline must be after the trading close." });
      return;
    }
    setSubmitState({ status: "submitting", message: "Confirm the USDC approval and market creation transactions in MetaMask." });
    try {
      const result = await createMarketOnchain({ adminAddress, question, category, description, resolutionSource, resolutionCriteria, tradingClosesAt: closeDate, resolutionDeadline: deadlineDate, initialLiquidity });
      setSubmitState({ status: "success", result, message: "Market created on-chain. It will appear in the app after indexer discovery." });
    } catch (error) {
      setSubmitState({ status: "error", message: error instanceof Error ? error.message : "The market transaction could not be submitted." });
    }
  }

  return <form className="mx-auto grid max-w-6xl gap-5 px-5 pb-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8" onSubmit={handleSubmit}>
    <div className="space-y-5">
      <Card step="01" title="Market details" description="Make the question neutral, clear, and objectively resolvable.">
        <Field label="MARKET QUESTION"><textarea className={`${inputClass} min-h-28 resize-y`} maxLength={180} onChange={(event) => setQuestion(event.target.value)} placeholder="Will Bitcoin close above $150,000 by December 31, 2026?" required value={question}/></Field><p className="mt-2 text-right font-mono text-[10px] text-slate-400">{question.length}/180</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="CATEGORY"><select className={inputClass} onChange={(event) => setCategory(event.target.value)} value={category}>{categories.map((item) => <option key={item}>{item}</option>)}</select></Field><div><p className="text-[11px] font-extrabold tracking-wide text-slate-700">MARKET TYPE</p><div className="mt-2 flex h-[46px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5"><span className="h-2 w-2 rounded-full bg-emerald-500"/><span className="text-sm font-bold text-slate-800">Binary · Yes / No</span><span className="ml-auto rounded bg-blue-50 px-2 py-1 font-mono text-[9px] font-bold text-blue-600">ON-CHAIN</span></div></div></div>
        <div className="mt-4"><Field label="CONTEXT FOR TRADERS"><textarea className={`${inputClass} min-h-24 resize-y`} maxLength={360} onChange={(event) => setDescription(event.target.value)} placeholder="Explain why this market matters and any useful context." value={description}/></Field></div>
      </Card>
      <Card step="02" title="Collateral & outcomes" description="USDC collateral backs transferable Yes / No outcome shares.">
        <div className="grid gap-4 sm:grid-cols-2"><Field hint="MetaMask will request a USDC allowance before creation." label="INITIAL LIQUIDITY (USDC)"><input className={inputClass} min="1" onChange={(event) => setInitialLiquidity(event.target.value)} required step="0.01" type="number" value={initialLiquidity}/></Field><div><p className="text-[11px] font-extrabold tracking-wide text-slate-700">OUTCOMES</p><div className="mt-2 grid grid-cols-2 gap-2"><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><span className="font-mono text-[10px] font-bold text-emerald-600">YES</span><strong className="mt-1 block text-sm">1:1 payout</strong></div><div className="rounded-xl border border-rose-100 bg-rose-50 p-3"><span className="font-mono text-[10px] font-bold text-rose-600">NO</span><strong className="mt-1 block text-sm">1:1 payout</strong></div></div></div></div>
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900"><strong>Price discovery:</strong> this version mints collateralized complete sets. An AMM/order-book layer is a separate audited upgrade, so the UI does not show a fake price control.</div>
      </Card>
      <Card step="03" title="Resolution rules" description="These fields are stored immutably in the market contract.">
        <Field label="RESOLUTION SOURCE"><input className={inputClass} onChange={(event) => setResolutionSource(event.target.value)} placeholder="e.g. official election authority or issuer's published close price" required value={resolutionSource}/></Field><div className="mt-4"><Field label="RESOLUTION CRITERIA"><textarea className={`${inputClass} min-h-32 resize-y`} onChange={(event) => setResolutionCriteria(event.target.value)} placeholder="State exactly what resolves Yes, No, or Invalid. Include edge cases and the official source URL." required value={resolutionCriteria}/></Field></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="TRADING CLOSES"><input className={inputClass} onChange={(event) => setTradingClosesAt(event.target.value)} required type="datetime-local" value={tradingClosesAt}/></Field><Field label="RESOLUTION DEADLINE"><input className={inputClass} onChange={(event) => setResolutionDeadline(event.target.value)} required type="datetime-local" value={resolutionDeadline}/></Field></div><label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4"><input checked={featured} className="h-4 w-4 accent-blue-600" onChange={(event) => setFeatured(event.target.checked)} type="checkbox"/><span><strong className="block text-sm">Feature after indexing</strong><span className="mt-0.5 block text-xs text-slate-500">This is UI metadata; it does not alter on-chain permissions.</span></span></label>
      </Card>
    </div>
    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start"><section className="rounded-2xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10"><p className="font-mono text-[10px] font-bold tracking-[0.16em] text-blue-300">ON-CHAIN PREVIEW</p><span className="mt-5 inline-block rounded bg-white/10 px-2 py-1 font-mono text-[9px] font-bold tracking-wider text-blue-200">{category.toUpperCase()}</span><h3 className="mt-3 text-lg font-bold leading-6">{question || "Your market question will appear here"}</h3><div className="mt-6 grid grid-cols-2 gap-2"><div className="rounded-xl bg-emerald-400/10 p-3"><span className="font-mono text-[10px] font-bold text-emerald-300">YES</span><strong className="mt-1 block">1:1 payout</strong></div><div className="rounded-xl bg-rose-400/10 p-3"><span className="font-mono text-[10px] font-bold text-rose-300">NO</span><strong className="mt-1 block">1:1 payout</strong></div></div><div className="mt-5 border-t border-white/10 pt-4 text-xs text-slate-400">Initial collateral <b className="float-right text-white">{initialLiquidity || "0"} USDC</b></div></section><section className="rounded-2xl border border-slate-200 bg-white p-5"><p className="font-mono text-[10px] font-bold tracking-[0.12em] text-slate-400">PRE-FLIGHT CHECK</p><ul className="mt-4 space-y-3 text-xs text-slate-600"><li className="flex gap-2"><span className="text-emerald-500">●</span>Admin wallet connected</li><li className="flex gap-2"><span className={deploymentConfigured ? "text-emerald-500" : "text-amber-500"}>{deploymentConfigured ? "●" : "!"}</span>{deploymentConfigured ? "Factory and collateral configured" : "Contract addresses missing — add them to .env.local"}</li><li className="flex gap-2"><span className="text-emerald-500">●</span>USDC approval will be requested</li></ul></section><button className="w-full rounded-xl bg-blue-600 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70" disabled={submitState.status === "submitting"} type="submit">{submitState.status === "submitting" ? "Waiting for MetaMask…" : "Create market on-chain →"}</button>{submitState.message && <div className={`rounded-xl border p-4 text-xs leading-5 ${submitState.status === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : submitState.status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-blue-200 bg-blue-50 text-blue-700"}`}>{submitState.message}{submitState.result && <div className="mt-3 space-y-1 font-mono text-[10px]"><a className="block underline" href={`https://sepolia.basescan.org/tx/${submitState.result.transactionHash}`} rel="noreferrer" target="_blank">View creation transaction ↗</a>{submitState.result.approvalHash && <a className="block underline" href={`https://sepolia.basescan.org/tx/${submitState.result.approvalHash}`} rel="noreferrer" target="_blank">View USDC approval ↗</a>}</div>}</div>}</aside>
  </form>;
}
