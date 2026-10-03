# Predexa on-chain market MVP

The first on-chain version uses a USDC-collateralized complete-set market.

- One USDC unit mints one transferable ERC-1155 YES share and one NO share.
- Before the close time, users can mint or merge matching complete sets.
- After the resolver declares YES or NO, one winning share redeems for one USDC unit.
- Invalid markets redeem both shares for half of a USDC unit each.

`PredictionMarketFactory` is the only creator of market contracts. Its owner is the on-chain admin and must be a multisig in production. The UI's environment-based admin display is not a substitute for this contract-level permission.

This contract deliberately does not include an AMM/order book. It creates collateralized markets and transferable outcome shares; price discovery can be added through an audited AMM or an off-chain signed-order system in the next phase.

## Testnet deployment

For the included test token and Base Sepolia, use the local deployment helper:

1. Get a small amount of Base Sepolia ETH for gas from a faucet.
2. Copy `.env.deploy.example` to `.env.deploy` and fill it locally. Never commit or share the private key:

   ```env
   RPC_URL=https://sepolia.base.org
   DEPLOYER_PRIVATE_KEY=0x...
   ADMIN_WALLET=0x...
   ```

3. Compile and deploy both contracts:

   ```bash
   npm run contracts:compile
   npm run contracts:deploy:base-sepolia
   ```

   The command deploys `MockUSDC` with an initial balance for `ADMIN_WALLET`, then deploys `PredictionMarketFactory` with `ADMIN_WALLET` as owner. It prints both contract addresses.

4. Copy the printed public values into `.env.local`:

   ```env
   NEXT_PUBLIC_CHAIN_ID=84532
   NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=0x...
   NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS=0x...
   NEXT_PUBLIC_COLLATERAL_DECIMALS=6
   ```

5. Restart Next.js and use the Create Market page with the factory owner wallet. The page will request USDC approval first, then submit the market creation transaction.

Do not use this MVP with real funds until tests, independent review, resolver governance, and compliance requirements are complete.
