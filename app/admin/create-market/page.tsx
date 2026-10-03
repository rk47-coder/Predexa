"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAccessGate } from "../../../components/admin/AdminAccessGate";
import { CreateMarketForm } from "../../../components/admin/CreateMarketForm";
import { getConnectedWallet, isAdminWallet, shortAddress } from "../../../lib/wallet";

export default function CreateMarketPage() {
  const [address, setAddress] = useState("");
  useEffect(() => setAddress(getConnectedWallet()), []);
  const isAdmin = isAdminWallet(address);

  return (
    <AdminAccessGate connectedAddress={address} isAdmin={isAdmin}>
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <nav className="flex h-[72px] items-center border-b border-slate-200 bg-white px-5 sm:px-10">
          <Link className="text-xl font-extrabold tracking-[-0.06em]" href="/">predexa</Link>
          <div className="ml-auto mr-5 hidden items-center gap-2 font-mono text-[11px] font-bold text-slate-500 sm:flex"><span className="rounded bg-blue-50 px-2 py-1 text-[9px] tracking-wider text-blue-600">ADMIN</span>{shortAddress(address)}</div>
          <Link className="text-sm font-bold text-blue-600" href="/">← Markets</Link>
        </nav>
        <section className="mx-auto flex max-w-6xl items-end justify-between gap-6 px-5 py-12 lg:px-8">
          <div><p className="mb-3 font-mono text-[10px] font-bold tracking-[0.16em] text-blue-600">ADMIN CONSOLE · BASE SEPOLIA</p><h1 className="text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl">Create a market</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Publish immutable market rules and USDC-collateralized outcome shares directly through the Predexa factory contract.</p></div>
          <span className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[10px] font-bold text-slate-500 lg:block">DRAFT · ON-CHAIN READY</span>
        </section>
        <CreateMarketForm adminAddress={address}/>
      </main>
    </AdminAccessGate>
  );
}
