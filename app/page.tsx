"use client";

import { useEffect, useMemo, useState } from "react";
import { WalletModal } from "../components/WalletModal";
import { WalletDropdown } from "../components/WalletDropdown";
import headerStyles from "../components/HeaderActions.module.css";
import { clearConnectedWallet, connectMetaMask, getWalletBalance, isAdminWallet, isNormalUserWallet, saveConnectedWallet, shortAddress } from "../lib/wallet";

type Market = {
  category: string;
  tag: string;
  title: string;
  chance: number;
  change: string;
  volume: string;
  people: string;
  chart: string;
  color: "blue" | "violet" | "orange" | "green";
  image: string;
};

const markets: Market[] = [
  {
    category: "Politics",
    tag: "US ELECTION",
    title: "Will the Democratic nominee win the 2028 election?",
    chance: 56,
    change: "+3.2%",
    volume: "$12.4m Vol.",
    people: "2.8k traders",
    chart: "M4 54 C18 51 18 44 29 47 S43 35 55 40 S72 18 84 27 S98 12 118 16 S133 5 150 8",
    color: "blue",
    image: "election",
  },
  {
    category: "Crypto",
    tag: "BITCOIN",
    title: "Will Bitcoin trade above $150,000 in 2026?",
    chance: 68,
    change: "+8.7%",
    volume: "$8.9m Vol.",
    people: "1.7k traders",
    chart: "M4 60 C12 48 23 52 32 41 S48 46 57 29 S68 38 79 23 S93 32 105 17 S122 20 150 4",
    color: "orange",
    image: "bitcoin",
  },
  {
    category: "Technology",
    tag: "ARTIFICIAL INTELLIGENCE",
    title: "Will an AI company reach $5T valuation this year?",
    chance: 42,
    change: "+1.4%",
    volume: "$6.1m Vol.",
    people: "964 traders",
    chart: "M4 51 C17 31 24 46 35 42 S48 56 62 46 S76 35 88 43 S98 29 112 35 S132 15 150 25",
    color: "violet",
    image: "ai",
  },
  {
    category: "Sports",
    tag: "NBA FINALS",
    title: "Will the Thunder win the 2026 NBA Championship?",
    chance: 71,
    change: "+5.9%",
    volume: "$4.6m Vol.",
    people: "1.2k traders",
    chart: "M4 57 C15 57 19 42 30 47 S42 37 54 34 S69 38 81 28 S97 30 105 18 S125 22 150 6",
    color: "green",
    image: "sports",
  },
];

const news = [
  { category: "POLITICS", time: "2h ago", title: "Campaign spending hits a record as the race narrows", accent: "rose" },
  { category: "MARKETS", time: "4h ago", title: "Fed signals patience as inflation holds steady", accent: "blue" },
  { category: "TECHNOLOGY", time: "Yesterday", title: "The AI infrastructure build-out is accelerating", accent: "violet" },
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></>,
    chevron: <path d="m7 10 5 5 5-5"/>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    spark: <path d="m12 2 1.75 6.25L20 10l-6.25 1.75L12 18l-1.75-6.25L4 10l6.25-1.75L12 2Z"/>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    filter: <path d="M4 6h16M7 12h10m-7 6h4"/>,
    wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19a1 1 0 0 1 1 1v13H6a2 2 0 0 1-2-2V7.5Z"/><path d="M4 8h15a1 1 0 0 1 1 1v4H16a2 2 0 0 0 0 4h4"/><circle cx="16" cy="15" r=".7" fill="currentColor"/></>,
    fire: <path d="M12 22c4 0 7-2.5 7-6.5 0-2.5-1.5-4.8-4.2-7.5.1 2.2-1.3 3.8-2.5 4.6.1-3.6-1.5-6.6-4.6-9.1C8.1 8.1 4 10.7 4 15.5 4 19.5 8 22 12 22Z"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function MarketVisual({ type }: { type: Market["image"] }) {
  if (type === "bitcoin") return <div className="market-visual bitcoin"><div className="coin">₿</div><i/><i/><i/></div>;
  if (type === "ai") return <div className="market-visual ai"><div className="ai-orb"/><span>AI</span><b>×</b></div>;
  if (type === "sports") return <div className="market-visual sports"><div className="ball"/><div className="court-line"/></div>;
  return <div className="market-visual election"><div className="flag"><span/><span/><span/><span/><span/></div><div className="capitol"><i/><i/><i/></div></div>;
}

function MarketCard({ market, compact = false }: { market: Market; compact?: boolean }) {
  return (
    <article className={`market-card ${compact ? "compact" : ""}`}>
      <div className="card-top"><span className={`category-dot ${market.color}`}/><span>{market.category}</span><button className="more" aria-label="More options">•••</button></div>
      <MarketVisual type={market.image}/>
      <div className="market-copy">
        <p className="eyebrow">{market.tag}</p>
        <h3>{market.title}</h3>
      </div>
      <div className="market-stats"><div><strong>{market.chance}%</strong><span>chance</span></div><span className="positive">{market.change}</span></div>
      <svg className={`chart ${market.color}`} viewBox="0 0 154 66" preserveAspectRatio="none"><defs><linearGradient id={`fill-${market.color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".22"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><path d={`${market.chart} L150 66 L4 66Z`} fill={`url(#fill-${market.color})`}/><path d={market.chart} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"/></svg>
      <div className="card-bottom"><span>{market.volume}</span><span>{market.people}</span></div>
    </article>
  );
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Markets");
  const [activeCategory, setActiveCategory] = useState("Trending");
  const [query, setQuery] = useState("");
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState("");
  const filteredMarkets = useMemo(() => markets.filter((market) => market.title.toLowerCase().includes(query.toLowerCase()) || market.category.toLowerCase().includes(query.toLowerCase())), [query]);
  const categories = ["Trending", "Politics", "Crypto", "Sports", "Technology", "Culture"];
  const isAdmin = isAdminWallet(walletAddress);
  const isNormalUser = isNormalUserWallet(walletAddress);

  useEffect(() => {
    if (!walletAddress) {
      setWalletBalance("");
      return;
    }

    getWalletBalance(walletAddress).then(setWalletBalance).catch(() => setWalletBalance("Unavailable"));
  }, [walletAddress]);

  async function handleMetaMaskConnect() {
    setIsConnecting(true);
    setWalletError("");
    try {
      const account = await connectMetaMask();
      setWalletAddress(account);
      saveConnectedWallet(account);
      setIsWalletModalOpen(false);
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Could not connect MetaMask. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <main>
      <nav className="navbar">
        <a className="brand" href="#top" aria-label="Predexa home"><span className="brand-mark"><i/><i/><i/></span><span>predexa</span></a>
        <div className="nav-links">{["Markets", "News", "Portfolio"].map((item) => <button key={item} className={activeNav === item ? "active" : ""} onClick={() => setActiveNav(item)}>{item}</button>)}{isAdmin && <a className={headerStyles.createMarket} href="/admin/create-market"><Icon name="grid" size={15}/> Create market</a>}</div>
        <label className="search"><Icon name="search" size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search markets"/><kbd>⌘ K</kbd></label>
        <div className="nav-actions"><button className="icon-button" aria-label="Toggle theme">☼</button><div className={headerStyles.walletControl}><button className={`wallet-button ${walletAddress ? "wallet-connected" : ""}`} aria-expanded={isWalletMenuOpen} onClick={() => walletAddress ? setIsWalletMenuOpen((isOpen) => !isOpen) : setIsWalletModalOpen(true)}><Icon name="wallet" size={18}/><span>{walletAddress ? shortAddress(walletAddress) : "Connect wallet"}</span><Icon name="chevron" size={15}/></button>{walletAddress && isWalletMenuOpen && <WalletDropdown address={walletAddress} balance={walletBalance} isAdmin={isAdmin} isNormalUser={isNormalUser} onDisconnect={() => { clearConnectedWallet(); setWalletAddress(""); setIsWalletMenuOpen(false); }}/>}</div></div>
      </nav>
      {isWalletModalOpen && <WalletModal isConnecting={isConnecting} error={walletError} onClose={() => { setIsWalletModalOpen(false); setWalletError(""); }} onConnectMetaMask={handleMetaMaskConnect}/>} 

      <section className="hero" id="top">
        <div className="hero-copy"><div className="live-pill"><span/> LIVE PREDICTIONS</div><h1>Trade on what <em>happens next.</em></h1><p>Make smarter decisions with the market&apos;s collective intelligence.</p><button className="primary-button" onClick={() => document.getElementById("markets")?.scrollIntoView({ behavior: "smooth" })}>Explore markets <Icon name="arrow" size={18}/></button></div>
        <div className="hero-art" aria-hidden="true"><div className="orb orb-one"/><div className="orb orb-two"/><div className="globe"><div className="globe-line line-one"/><div className="globe-line line-two"/><div className="globe-line line-three"/><div className="land land-a"/><div className="land land-b"/><div className="land land-c"/><span className="pin pin-a"/><span className="pin pin-b"/><span className="pin pin-c"/></div><div className="floating-card fc-one"><span className="tiny-dot blue"/> Presidential election <strong>56¢</strong></div><div className="floating-card fc-two"><span className="tiny-dot orange"/> Bitcoin above $150k <strong>68¢</strong></div></div>
      </section>

      <section className="ticker"><div><span className="ticker-label"><Icon name="fire" size={15}/> TOP MOVERS</span><span>Bitcoin $150k <b className="positive">+8.7%</b></span><span>NBA Finals <b className="positive">+5.9%</b></span><span>Fed rate cut <b className="negative">−2.4%</b></span><span>Election 2028 <b className="positive">+3.2%</b></span></div></section>

      <section className="market-section" id="markets">
        <div className="section-heading"><div><p className="section-kicker">DISCOVER</p><h2>Markets <span>moving now</span></h2></div><button className="view-all">View all markets <Icon name="arrow" size={17}/></button></div>
        <div className="category-row"><div className="category-scroll">{categories.map((category) => <button onClick={() => setActiveCategory(category)} className={activeCategory === category ? "selected" : ""} key={category}>{category === "Trending" && <Icon name="spark" size={14}/>} {category}</button>)}</div><button className="filter-button"><Icon name="filter" size={16}/> Filter</button></div>
        <div className="market-grid">{filteredMarkets.map((market) => <MarketCard key={market.title} market={market}/>)}</div>
        {filteredMarkets.length === 0 && <p className="empty-state">No markets match “{query}”. Try a different search.</p>}
      </section>

      <section className="bottom-section">
        <div className="news-panel"><div className="section-heading"><div><p className="section-kicker">STAY INFORMED</p><h2>Latest <span>news</span></h2></div><button className="view-all">All news <Icon name="arrow" size={17}/></button></div><div className="news-list">{news.map((item) => <article className="news-item" key={item.title}><div className={`news-image ${item.accent}`}><div className="abstract-shape"/></div><div><p className="news-meta">{item.category} <i/> {item.time}</p><h3>{item.title}</h3><button>Read story <Icon name="arrow" size={15}/></button></div></article>)}</div></div>
        <aside className="join-card"><div className="join-spark"><Icon name="spark" size={21}/></div><p className="section-kicker">YOUR EDGE, UNLOCKED</p><h2>The future is<br/><em>yours to trade.</em></h2><p>Join a global community finding signal in the noise.</p><button className="light-button">Get started <Icon name="arrow" size={18}/></button><div className="join-grid"/></aside>
      </section>

      <footer><a className="brand" href="#top"><span className="brand-mark"><i/><i/><i/></span><span>predexa</span></a><span>© 2026 Predexa. Markets made for everyone.</span><div><a href="#markets">Markets</a><a href="#top">About</a><a href="#top">Help center</a></div></footer>
    </main>
  );
}
