"use client";

import { FormEvent, useEffect, useState } from "react";
import { getConnectedWallet, isAdminWallet, shortAddress } from "../../../lib/wallet";
import styles from "./page.module.css";

const categories = ["Politics", "Crypto", "Economy", "Sports", "Technology", "Culture"];

export default function CreateMarketPage() {
  const [address, setAddress] = useState("");
  const [marketType, setMarketType] = useState("binary");
  const [isFeatured, setIsFeatured] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [question, setQuestion] = useState("");
  const isAdmin = isAdminWallet(address);

  useEffect(() => setAddress(getConnectedWallet()), []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (!isAdmin) {
    return (
      <main className={styles.page}>
        <nav className={styles.nav}><a className={styles.brand} href="/">predexa</a><a className={styles.back} href="/">← Back to markets</a></nav>
        <section className={styles.denied}><p className={styles.eyebrow}>RESTRICTED AREA</p><h1>Admin wallet required</h1><p>Connect the wallet configured as <code>NEXT_PUBLIC_ADMIN_WALLET</code> from the markets page, then open this page again.</p><a className={styles.primary} href="/">Go to markets</a></section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <nav className={styles.nav}><a className={styles.brand} href="/">predexa</a><div className={styles.adminIdentity}><span>ADMIN</span>{shortAddress(address)}</div><a className={styles.back} href="/">← Markets</a></nav>
      <section className={styles.header}><div><p className={styles.eyebrow}>ADMIN CONSOLE · MARKET FACTORY</p><h1>Create a new market</h1><p>Set clear rules and a verifiable resolution source before publishing.</p></div><div className={styles.draft}>Draft · Not published</div></section>
      <form className={styles.layout} onSubmit={handleSubmit}>
        <div className={styles.formColumn}>
          <section className={styles.card}><div className={styles.cardHeader}><span className={styles.step}>01</span><div><h2>Market details</h2><p>Write a concise, tradeable question.</p></div></div><label>Market question<textarea required value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Will Bitcoin close above $150,000 by December 31, 2026?" maxLength={180}/><small>{question.length}/180 characters</small></label><div className={styles.twoColumns}><label>Category<select defaultValue="Crypto">{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Market visibility<select defaultValue="Public"><option>Public</option><option>Unlisted</option><option>Private</option></select></label></div><label>Short description<textarea placeholder="Give traders the context they need to understand this market." maxLength={360}/></label></section>

          <section className={styles.card}><div className={styles.cardHeader}><span className={styles.step}>02</span><div><h2>Outcomes & pricing</h2><p>Define exactly what traders can buy.</p></div></div><div className={styles.typeSwitch}><button type="button" onClick={() => setMarketType("binary")} className={marketType === "binary" ? styles.activeType : ""}>Yes / No</button><button type="button" onClick={() => setMarketType("multiple")} className={marketType === "multiple" ? styles.activeType : ""}>Multiple outcomes</button></div>{marketType === "binary" ? <div className={styles.outcomes}><div><span className={styles.yesDot}/>YES <input aria-label="Yes outcome label" defaultValue="Yes"/></div><div><span className={styles.noDot}/>NO <input aria-label="No outcome label" defaultValue="No"/></div></div> : <div className={styles.multiOutcomes}><input placeholder="Outcome 1"/><input placeholder="Outcome 2"/><button type="button">+ Add outcome</button></div>}<div className={styles.twoColumns}><label>Initial liquidity<input type="number" min="100" defaultValue="1000"/><small>USDC, minimum 100</small></label><label>Initial YES price<input type="number" min="1" max="99" defaultValue="50"/><small>¢ per share</small></label></div></section>

          <section className={styles.card}><div className={styles.cardHeader}><span className={styles.step}>03</span><div><h2>Resolution rules</h2><p>These rules decide the final outcome.</p></div></div><label>Resolution source<input required placeholder="e.g. Federal Reserve, official election authority"/></label><label>Resolution criteria<textarea required placeholder="State precisely when this market resolves Yes, No, or Invalid. Include edge cases."/></label><div className={styles.twoColumns}><label>Trading closes<input required type="datetime-local"/></label><label>Resolution deadline<input required type="datetime-local"/></label></div><label className={styles.toggle}><input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)}/><span/><div><strong>Feature this market</strong><small>Show it in the Trending discovery section.</small></div></label></section>
        </div>
        <aside className={styles.sidebar}><section className={styles.preview}><p className={styles.previewLabel}>MARKET PREVIEW</p><span className={styles.category}>CRYPTO</span><h3>{question || "Your market question will appear here"}</h3><div className={styles.previewPrices}><div><strong>50¢</strong><span>Yes</span></div><div><strong>50¢</strong><span>No</span></div></div><p>Initial liquidity <b>$1,000</b></p></section><section className={styles.checklist}><h3>Pre-publish checklist</h3><p><i/> Clear, neutral question</p><p><i/> Verifiable resolution source</p><p><i/> Exact closing date</p></section><button className={styles.publish} type="submit">Review & publish market <span>→</span></button>{submitted && <p className={styles.success}>Market draft is ready for final review. Publishing requires backend approval.</p>}</aside>
      </form>
    </main>
  );
}
