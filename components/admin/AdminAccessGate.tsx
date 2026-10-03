import Link from "next/link";

type AdminAccessGateProps = {
  connectedAddress: string;
  isAdmin: boolean;
  children: React.ReactNode;
};

export function AdminAccessGate({ connectedAddress, isAdmin, children }: AdminAccessGateProps) {
  if (isAdmin) return <>{children}</>;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <nav className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-6 sm:px-10">
        <Link className="text-xl font-extrabold tracking-[-0.06em]" href="/">predexa</Link>
        <Link className="text-sm font-bold text-blue-600" href="/">← Back to markets</Link>
      </nav>
      <section className="mx-auto max-w-xl px-6 py-28 text-center">
        <p className="mb-3 font-mono text-[11px] font-bold tracking-[0.16em] text-blue-600">RESTRICTED ADMIN AREA</p>
        <h1 className="text-4xl font-extrabold tracking-[-0.06em]">Admin wallet required</h1>
        <p className="mt-5 text-sm leading-7 text-slate-600">{connectedAddress ? "The connected wallet does not match NEXT_PUBLIC_ADMIN_WALLET. Switch to the configured admin account, then reconnect from Markets." : "Connect the wallet configured as NEXT_PUBLIC_ADMIN_WALLET from the Markets page before opening the market factory."}</p>
        <Link className="mt-8 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700" href="/">Go to markets</Link>
      </section>
    </main>
  );
}
