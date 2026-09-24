import styles from "./WalletModal.module.css";

type WalletModalProps = {
  isConnecting: boolean;
  error: string;
  onClose: () => void;
  onConnectMetaMask: () => void;
};

export function WalletModal({ isConnecting, error, onClose, onConnectMetaMask }: WalletModalProps) {
  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="wallet-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close wallet dialog">×</button>
        <div className={styles.icon}>⌁</div>
        <p className={styles.kicker}>PREDExA WALLET</p>
        <h2 id="wallet-title">Connect your wallet</h2>
        <p className={styles.copy}>Choose a wallet to trade markets and track your positions.</p>
        <button className={styles.walletOption} onClick={onConnectMetaMask} disabled={isConnecting}>
          <span className={styles.metamask}>🦊</span>
          <span><strong>MetaMask</strong><small>Browser wallet</small></span>
          <b>{isConnecting ? "Connecting…" : "Connect →"}</b>
        </button>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <p className={styles.legal}>By connecting, you agree to Predexa&apos;s Terms of Service and Privacy Policy.</p>
      </section>
    </div>
  );
}
