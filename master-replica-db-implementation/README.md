### **1. Create a Docker Network**

```sh
docker network create pg-network
```

---

### **2. Start Master Database**

```sh
docker run -d --name pg-master \
  --network pg-network \
  -e POSTGRES_PASSWORD=masterpass \
  -e POSTGRES_DB=mydb \
  -v pg-master-data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:14 -c wal_level=replica
```

---

### **3. Configure Master for Replication**

#### a. Create replication user:

```sh
docker exec -it pg-master psql -U postgres -c \
  "CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replicapass';"
```

#### b. Allow replication in `pg_hba.conf`:

```sh
docker exec -it pg-master bash -c \
  "echo 'host replication replicator 0.0.0.0/0 md5' >> /var/lib/postgresql/data/pg_hba.conf"
```

#### c. Restart master:

```sh
docker restart pg-master
```

---

### **4. Initialize Replica Database**

#### a. Start replica container:

```sh
docker run -d --name pg-replica \
  --network pg-network \
  -e POSTGRES_PASSWORD=replicapass \
  -v pg-replica-data:/var/lib/postgresql/data \
  -p 5433:5432 \
  postgres:14 \
  -c "primary_conninfo=host=pg-master port=5432 user=replicator password=replicapass"
```

#### b. Perform base backup:

```sh
docker exec -it pg-replica bash -c \
  "rm -rf /var/lib/postgresql/data/* && \
   pg_basebackup -h pg-master -U replicator -D /var/lib/postgresql/data -P -R"
```

#### c. Restart replica:

```sh
docker restart pg-replica
```

---

### **5. Verify Replication**

#### a. Check replication status on master:

```sh
docker exec -it pg-master psql -U postgres -c "SELECT * FROM pg_stat_replication;"
```

#### b. Test data sync:

**Insert data on master:**

```sh
docker exec -it pg-master psql -U postgres -d mydb -c \
  "INSERT INTO test(data) VALUES ('Hello from master');"
```

**Read from replica:**

```sh
docker exec -it pg-replica psql -U postgres -d mydb -c "SELECT * FROM test;"
```


