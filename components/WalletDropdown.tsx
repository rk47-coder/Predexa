import { shortAddress } from "../lib/wallet";
import styles from "./WalletDropdown.module.css";

type WalletDropdownProps = {
  address: string;
  balance: string;
  isAdmin: boolean;
  isNormalUser: boolean;
  onDisconnect: () => void;
};

export function WalletDropdown({ address, balance, isAdmin, isNormalUser, onDisconnect }: WalletDropdownProps) {
  return (
    <section className={styles.menu} aria-label="Wallet details">
      <div className={styles.account}>
        <span className={styles.avatar}>{address.slice(2, 4).toUpperCase()}</span>
        <div><strong>{shortAddress(address)}</strong><small><i/> Connected with MetaMask</small></div>
      </div>
      <p className={isAdmin ? styles.admin : styles.normal}>{isAdmin ? "Admin wallet" : isNormalUser ? "Normal user wallet" : "Standard wallet"}</p>
      <div className={styles.balance}><span>Available balance</span><strong>{balance || "Loading…"}</strong></div>
      <button className={styles.disconnect} onClick={onDisconnect}>Disconnect wallet <span>→</span></button>
    </section>
  );
}
