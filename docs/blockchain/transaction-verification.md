# Base transaction verification

The server never trusts a transaction hash by itself. Before CrownFi updates its database index, the confirmation route verifies the receipt on the configured Base chain.

For prediction-market actions, verify:

- the receipt succeeded;
- the transaction sender matches the authenticated Base address;
- the destination is the configured `CrownFiPredictionMarket` contract;
- the expected contract event exists;
- market ID, option, amount, and participant match the prepared action;
- a transaction hash is not accepted twice.

For vote checkpoints, verify the publisher is an authorized admin and that `CheckpointPublished` contains the expected round ID, Merkle root, tally hash, and total vote count.

The application is a testnet implementation, not a general-purpose chain indexer. Production use needs durable workers, retries, confirmation-depth rules, RPC failover, and monitoring.
