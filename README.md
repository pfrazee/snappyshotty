# Snappy Shotty

A set of nodejs scripts for backfilling the atproto network and then emitting records to be ingested into other systems.

## Commands

### Fetch the DID list

Contacts a relay using `com.atproto.sync.listReposByCollection({collection: 'app.bsky.actor.profile'})` to enumerate Bluesky-specific users. 
*NOTE: at time of writing, the relay in use (`https://relay1.us-west.bsky.network`) only provides the DIDs of repos which have been active since ~Feb 2025.*

```bash
DATA_DIR=/data node ./atproto/fetch-known-dids.mjs 2> fetch-known-dids.log
```

### Sync repo CARs

Fetches repos and stores them as `.car` files in the `./.repos` directory. Skips any repo files which are already synced.

```bash
DATA_DIR=/data node ./atproto/backfill.mjs 2> backfill.log
```

### Export user nodes to neo4j

```
DATA_DIR=/data node ./csv/dump-users-csv.mjs 2> user-nodes.log
neo4j-admin database import full neo4j --nodes=User=/data/.csv/users.csv
```

### Export follow edges to neo4j

```
DATA_DIR=/data node ./csv/dump-follows-csvs.mjs 2> user-nodes.log
for i in /data/.csv/follows-*.csv; do
  neo4j-admin database import full neo4j --relationships=FOLLOWS=$i
done
```

## LICENSE

Copyright Bluesky Social PBC 2026, Licensed MIT