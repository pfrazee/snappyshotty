# Snappy Shotty

A set of nodejs scripts for backfilling the atproto network and then emitting records to be ingested into other systems.

## Commands

### Fetch the DID list

Contacts a relay using `com.atproto.sync.listReposByCollection({collection: 'app.bsky.actor.profile'})` to enumerate Bluesky-specific users. 
*NOTE: at time of writing, the relay in use (`https://relay1.us-west.bsky.network`) only provides the DIDs of repos which have been active since ~Feb 2025.*

```bash
node fetch-known-dids.mjs
```

### Sync repo CARs

Fetches repos and stores them as `.car` files in the `./repos` directory. Skips any repo files which are already present.

```bash
node backfill.mjs
```

### Emit

TODO

## LICENSE

Copyright Bluesky Social PBC 2026, Licensed MIT