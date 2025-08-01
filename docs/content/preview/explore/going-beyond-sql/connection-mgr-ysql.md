---
title: Connection Manager in YSQL
headerTitle: Built-in connection pooling
linkTitle: Built-in connection pooling
description: Built-in server-side connection pooler for YSQL
headcontent: Built-in server-side connection pooler for YSQL
tags:
  feature: early-access
aliases:
   - /preview/explore/connection-manager/connection-mgr-ysql/
   - /preview/explore/connection-manager/
menu:
  preview:
    name: Built-in connection pooling
    identifier: explore-conn-mgr-ysql
    parent: going-beyond-sql
    weight: 600
type: docs
---

YugabyteDB inherits the architecture of creating one backend process for every connection to the database from PostgreSQL. These backend processes consume memory and CPU, limiting the number of connections YugabyteDB can support. To solve this problem, you can use a connection pooler, which allows multiplexing multiple client connections to a smaller number of actual server connections, thereby supporting a larger number of connections from applications. [PgBouncer](https://github.com/pgbouncer/pgbouncer) and [Odyssey](https://github.com/yandex/odyssey) are some of the popular PostgreSQL-based server-side connection pooling mechanisms that are fully compatible with YugabyteDB.

However, connection poolers have some limitations:

- Added complexity. Deploying and maintaining a connection pooler adds complexity to your application stack.
- They don't support all PostgreSQL features. For example, neither PgBouncer nor Odyssey supports SET statements in the transaction pooling mode.

To provide the advantages of connection pooling, but without the limitations, YugabyteDB includes a built-in connection pooler, YSQL Connection Manager. Because the manager is bundled with the product, it is convenient to manage, monitor, and configure the server connections without additional third-party tools. When combined with [smart drivers](../../../drivers-orms/smart-drivers/), YugabyteDB simplifies application architecture and enhances developer productivity.

![Connection manager](/images/explore/ysql-connection-manager.png)

## Key features

YSQL Connection Manager is a modified version of the open-source connection pooler Odyssey. YSQL Connection Manager uses Odyssey in the transaction pooling mode and has been modified at the wire protocol level for tighter integration with YugabyteDB to overcome some SQL limitations.

YSQL Connection Manager has the following key features:

- No SQL limitations. Unlike other pooling solutions running in transaction mode, YSQL Connection Manager supports SQL features such as TEMP TABLE, WITH HOLD CURSORS, and more.

- Per user and database pool, with quota sharing. Like PgBouncer and Odyssey, YSQL Connection Manager creates a pool for each unique combination of user and database. However, it also allows connection quotas to be shared across multiple such pools, enabling more efficient use of resources and improved scalability.

- Support for session parameters. YSQL Connection Manager supports SET statements, which are not supported by other connection poolers.

- Support for prepared statements. Odyssey supports protocol-level prepared statements and YSQL Connection Manager inherits this feature.

## Start YSQL Connection Manager

Currently, YSQL Connection Manager is supported in YugabyteDB and YugabyteDB Anywhere.

### YugabyteDB

To start a YugabyteDB cluster with YSQL Connection Manager, set the [yb-tserver](../../../reference/configuration/yb-tserver/) flag `enable_ysql_conn_mgr` to true.

For example, to create a single-node cluster with YSQL Connection Manager using [yugabyted](../../../reference/configuration/yugabyted/), use the following command:

```sh
./bin/yugabyted start --tserver_flags "enable_ysql_conn_mgr=true" --ui false
```

When `enable_ysql_conn_mgr` is set, each YB-TServer starts the YSQL Connection Manager process along with the PostgreSQL process. You should see one YSQL Connection Manager process per YB-TServer.

{{< note >}}

To create a large number of client connections, ensure that "SHMMNI" (the maximum number of concurrent shared memory segments an OS allows) as well as [ulimit](../../../deploy/manual-deployment/system-config/#set-ulimits) is set correctly as follows:

1. Open the file `/etc/sysctl.conf`.
1. Add `kernel.shmmni = 32768` (support for 30000 clients) at the end of the file.
1. To refresh the settings, use `sudo sysctl -p`.
{{< /note >}}

### YugabyteDB Anywhere

{{<tags/feature/ea idea="1368">}}While in Early Access, YSQL Connection Manager is not available in YugabyteDB Anywhere by default. To make connection pooling available, set the **Allow users to enable or disable connection pooling** Global Runtime Configuration option (config key yb.universe.allow_connection_pooling) to true. Refer to [Manage runtime configuration settings](../../../yugabyte-platform/administer-yugabyte-platform/manage-runtime-config/). You must be a Super Admin to set global runtime configuration flags.

To enable built-in connection pooling for universes deployed using YugabyteDB Anywhere:

- Turn on the **Connection pooling** option when creating a universe. Refer to [Create a multi-zone universe](../../../yugabyte-platform/create-deployments/create-universe-multi-zone/#advanced-configuration).
- Edit connection pooling on an existing universe. Refer to [Edit connection pooling](../../../yugabyte-platform/manage-deployments/edit-universe/#edit-connection-pooling).

Note that when managing universes using YugabyteDB Anywhere, do not set connection pooling flags, `enable_ysql_conn_mgr`, `ysql_conn_mgr_port`, and `pgsql_proxy_bind_address`.

#### Connect

To connect to the YSQL Connection Manager, use the [ysqlsh](../../../api/ysqlsh/) command with the [`-h <IP>`](../../../api/ysqlsh/#h-hostname-host-hostname) flag, instead of specifying the Unix-domain socket directory.

Using the socket directory along with [`-p`](../../../api/ysqlsh/#p-port-port-port) (custom PostgreSQL port or default 6433) will connect you to the PostgreSQL process, not the YSQL connection manager process.

### YugabyteDB Aeon

{{<tags/feature/ea idea="1368">}}To enable built-in connection pooling for clusters deployed using YugabyteDB Aeon:

- Turn on the **Connection Pooling** option when [creating a cluster](../../../yugabyte-cloud/cloud-basics/create-clusters/). (Connection Pooling is enabled by default for [Sandbox clusters](../../../yugabyte-cloud/cloud-basics/create-clusters/create-clusters-free/).)
- Edit connection pooling on the cluster **Settings>Connection Pooling** tab.

Enabling connection pooling on an Aeon cluster gives 10 client connections for every server connection by default.

## Configuration

By default, when YSQL Connection Manager is enabled, it uses the port 5433, and the backend database is assigned a random free port.

To explicitly set a port for YSQL, you should specify ports for the flags `ysql_conn_mgr_port` and [ysql_port](../../../reference/configuration/yugabyted/#advanced-flags).

The following table describes YB-TServer flags related to YSQL Connection Manager:

| flag | Description | Default |
|:---- | :---------- | :------ |
| enable_ysql_conn_mgr | Enables YSQL Connection Manager for the cluster. YB-TServer starts a YSQL Connection Manager process as a child process. | false |
| enable_ysql_conn_mgr_stats | Enable statistics collection from YSQL Connection Manager. These statistics are displayed at the endpoint `<ip_address_of_cluster>:13000/connections`. | true |
| ysql_conn_mgr_idle_time | Specifies the maximum idle time (in seconds) allowed for database connections created by YSQL Connection Manager. If a database connection remains idle without serving a client connection for a duration equal to, or exceeding this value, it is automatically closed by YSQL Connection Manager. | 60 |
| ysql_conn_mgr_max_client_connections | Maximum number of concurrent client connections allowed. | 10000 |
| ysql_conn_mgr_min_conns_per_db | Minimum number of physical connections that is present in the pool. This limit is not considered while closing a broken physical connection. | 1 |
| ysql_conn_mgr_num_workers | Number of worker threads used by YSQL Connection Manager. If set to 0, the number of worker threads will be half of the number of CPU cores. | 0 |
| ysql_conn_mgr_stats_interval | Interval (in seconds) for updating the YSQL Connection Manager statistics. | 1 |
| ysql_conn_mgr_superuser_sticky | Make superuser connections sticky. | true |
| ysql_conn_mgr_port | YSQL Connection Manager port to which clients can connect. This must be different from the PostgreSQL port set via `pgsql_proxy_bind_address`. | 5433 |
| ysql_conn_mgr_server_lifetime | The maximum duration (in seconds) that a backend PostgreSQL connection managed by YSQL Connection Manager can remain open after creation. | 3600 |
| ysql_conn_mgr_log_settings | Comma-separated list of log settings for YSQL Connection Manger. Can include  'log_debug', 'log_config', 'log_session', 'log_query', and 'log_stats'. | "" |
| ysql_conn_mgr_use_auth_backend | Enable the use of the auth-backend for authentication of logical connections. When false, the older auth-passthrough implementation is used. | true |
| ysql_conn_mgr_readahead_buffer_size | Size of the per-connection buffer (in bytes) used for IO read-ahead operations in YSQL Connection Manager. | 8192 |
| ysql_conn_mgr_tcp_keepalive | TCP keepalive time (in seconds) in YSQL Connection Manager. Set to zero to disable keepalive. | 15 |
| ysql_conn_mgr_tcp_keepalive_keep_interval | TCP keepalive interval (in seconds) in YSQL Connection Manager. Only applicable if 'ysql_conn_mgr_tcp_keepalive' is enabled. | 75 |
| ysql_conn_mgr_tcp_keepalive_probes | Number of TCP keepalive probes in YSQL Connection Manager. Only applicable if 'ysql_conn_mgr_tcp_keepalive' is enabled. | 9 |
| ysql_conn_mgr_tcp_keepalive_usr_timeout | TCP user timeout (in milliseconds) in YSQL Connection Manager. Only applicable if 'ysql_conn_mgr_tcp_keepalive' is enabled. | 9 |
| ysql_conn_mgr_pool_timeout | Server pool wait timeout (in milliseconds) in YSQL Connection Manager. This is the time clients wait for an available server, after which they are disconnected. If set to zero, clients wait for server connections indefinitely. | 0 |
| ysql_conn_mgr_sequence_support_mode | Sequence support mode when YSQL connection manager is enabled. When set to  'pooled_without_curval_lastval', the currval() and lastval() functions are not supported. When set to 'pooled_with_curval_lastval', the currval() and lastval() functions are supported. For both settings, monotonic sequence order is not guaranteed if `ysql_sequence_cache_method` is set to `connection`. To also support monotonic order, set this flag to `session`. | pooled_without_curval_lastval |
| ysql_conn_mgr_optimized_extended_query_protocol | Enables optimization of [extended-query protocol](https://www.postgresql.org/docs/current/protocol-overview.html#PROTOCOL-QUERY-CONCEPTS) to provide better performance; note that while optimization is enabled, you may have correctness issues if you alter the schema of objects used in prepared statements. If set to false, extended-query protocol handling is always fully correct but unoptimized. | true |

## Authentication methods

The following table outlines the various authentication methods supported by YugabyteDB and their compatibility with the YSQL Connection Manager when a connection matches an HBA (Host-Based Authentication) record.

| | Auth Method | Description |
|:--| :---------------------| :------------ | :---- |
| {{<icon/no>}} | Ident Authentication | Server contacts client's OS to verify username that initiated connection, trusting OS-level identity.|
| {{<icon/no>}} | Peer Authentication | For local/Unix socket connections, server checks that the connecting UNIX user matches the requested database user, relying on OS user identity. |
| {{<icon/yes>}} | Plain/Clear Text Password | Standard password-based authentication, though storing passwords in plain text is not recommended. |
| {{<icon/yes>}} | JWT Authentication (OIDC) | Uses JSON Web Tokens (JWT) from an external Identity Provider (IDP) to securely transmit authentication and authorization information. |
| {{<icon/yes>}} | LDAP Authentication | Verifies users against a centralized directory service using Lightweight Directory Access Protocol (LDAP). |
| {{<icon/no>}} | GSS API or Kerberos| Enables Kerberos-based authentication through a standardized API, allowing secure, enterprise-grade Single Sign-On (SSO) logins without passwords. <br> **Note**: Testing of this feature with YugabyteDB is currently limited.|
| {{<icon/no>}} | SCRAM-sha256  | A secure password-based authentication that protects credentials using hashing, salting, and challenge-response. |
| {{<icon/yes>}} | MD5 | Password-based authentication where the user's password is by default stored in MD5 encryption format in the database. |
| {{<icon/no>}} | Cert  | Certificate-based authentication requires the client to provide certificates to the server over a TLS connection for authentication. |

## Sticky connections

YSQL Connection Manager enables a larger number of client connections to efficiently share a smaller pool of backend processes using a many-to-one multiplexing model. However, in certain cases, a backend process may enter a state that prevents connection multiplexing between transactions. When this occurs, the backend process remains dedicated to a single logical connection (hence the term "sticky connection") for the entire session rather than just a single transaction. This behavior deviates from the typical use case, where backend processes are reassigned after each transaction.

Currently, once formed, sticky connections remain sticky until the end of the session. At the end of the session, the backend process corresponding to a sticky connection is destroyed along with the connection, and the connection does not return to the pool.

When using YSQL Connection Manager, sticky connections can form in the following circumstances:

- Creating TEMP tables
- Declaring a CURSOR using the WITH HOLD attribute
- Using a PREPARE query (not to be confused with protocol-level preparation of statements)
- Superuser connections; if you want superuser connections to not be sticky, set the `ysql_conn_mgr_superuser_sticky` flag to false
- Using a SEQUENCE with `ysql_conn_mgr_sequence_support_mode` set to `session`. (Other values for this flag provide lesser support without stickiness.)
- Replication connections
- Setting the following configuration parameters during the session:
  - `session_authorization`
  - `role`
  - `default_tablespace`
  - `temp_tablespaces`
  - Any string-type variables of extensions
  - `yb_read_after_commit_visibility`

## Limitations

- Changes to [configuration parameters](../../../reference/configuration/yb-tserver/#postgresql-configuration-parameters) for a user or database that are set using ALTER ROLE SET or ALTER DATABASE SET queries may reflect in other pre-existing active sessions.
- YSQL Connection Manager can route up to 10,000 connection pools. This includes pools corresponding to dropped users and databases.
- Prepared statements may be visible to other sessions in the same connection pool. [#24652](https://github.com/yugabyte/yugabyte-db/issues/24652)
- Attempting to use DEALLOCATE/DEALLOCATE ALL queries can result in unexpected behavior. [#24653](https://github.com/yugabyte/yugabyte-db/issues/24653)
- Currently, you can't apply custom configurations to individual pools. The YSQL Connection Manager configuration applies to all pools.
- When YSQL Connection Manager is enabled, the backend PID stored using JDBC drivers may not be accurate. This does not affect backend-specific functionalities (for example, cancel queries), but this PID should not be used to identify the backend process.
- By default, `currval` and `nextval` functions do not work when YSQL Connection Manager is enabled. They can be supported with the help of the `ysql_conn_mgr_sequence_support_mode` flag.
- YSQL Connection Manager does not yet support IPv6 connections. [#24765](https://github.com/yugabyte/yugabyte-db/issues/24765)
- Currently, [auth-method](https://docs.yugabyte.com/preview/secure/authentication/host-based-authentication/#auth-method) `cert` is not supported for host-based authentication. [#20658](https://github.com/yugabyte/yugabyte-db/issues/20658)
- Although the use of auth-backends (`ysql_conn_mgr_use_auth_backend=true`) to authenticate logical connections can result in higher connection acquisition latencies, using auth-passthrough (`ysql_conn_mgr_use_auth_backend=false`) may not be suitable depending on your workload. Contact the YSQL Connection Manager Development team before setting `ysql_conn_mgr_use_auth_backend` to false. [#25313](https://github.com/yugabyte/yugabyte-db/issues/25313)
- Salted Challenge Response Authentication Mechanism ([SCRAM](https://docs.yugabyte.com/preview/secure/authentication/password-authentication/#scram-sha-256)) is not supported with YSQL Connection Manager. [#25870](https://github.com/yugabyte/yugabyte-db/issues/25870)
- Unix socket connections to YSQL Connection Manager are not supported. [#20048](https://github.com/yugabyte/yugabyte-db/issues/20048)
