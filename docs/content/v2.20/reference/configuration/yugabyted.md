---
title: yugabyted reference
headerTitle: yugabyted
linkTitle: yugabyted
description: Use yugabyted to deploy YugabyteDB clusters.
headcontent: Utility for deploying and managing YugabyteDB
menu:
  v2.20:
    identifier: yugabyted
    parent: configuration
    weight: 100
type: docs
rightNav:
  hideH4: true
---

Use yugabyted to launch and manage YugabyteDB universes locally on your laptop, or on VMs for production deployments.

{{< youtube id="ah_fPDpZjnc" title="How to Start YugabyteDB on Your Laptop" >}}

The yugabyted executable file is located in the YugabyteDB home's `bin` directory.

For examples of using yugabyted to deploy single- and multi-node clusters, see [Examples](#examples).

{{<note title="Production deployments">}}
You can use yugabyted for production deployments (v2.18.4 and later). You can also administer [`yb-tserver`](../yb-tserver/) and [`yb-master`](../yb-master/) directly (refer to [Deploy YugabyteDB](../../../deploy/)).
{{</note>}}

{{% note title="Running on macOS" %}}

Running YugabyteDB on macOS requires additional settings. For more information, refer to [Running on macOS](#running-on-macos).

{{% /note %}}

## Syntax

```sh
yugabyted [-h] [ <command> ] [ <flags> ]
```

- *command*: command to run
- *flags*: one or more flags, separated by spaces.

### Example

```sh
$ ./bin/yugabyted start
```

### Online help

You can access command-line help for yugabyted by running one of the following examples from the YugabyteDB home:

```sh
$ ./bin/yugabyted -h
```

```sh
$ ./bin/yugabyted -help
```

For help with specific yugabyted commands, run 'yugabyted [ command ] -h'. For example, you can print the command-line help for the `yugabyted start` command by running the following:

```sh
$ ./bin/yugabyted start -h
```

## Commands

The following commands are available:

- [cert](#cert)
- [collect_logs](#collect-logs)
- [configure](#configure)
- [configure_read_replica](#configure-read-replica)
- [connect](#connect)
- [demo](#demo)
- [destroy](#destroy)
- [start](#start)
- [status](#status)
- [stop](#stop)
- [version](#version)

-----

### cert

Use the `yugabyted cert` command to create TLS/SSL certificates for deploying a secure YugabyteDB cluster.

#### Syntax

```text
Usage: yugabyted cert [command] [flags]
```

#### Commands

The following sub-commands are available for the `yugabyted cert` command:

- [generate_server_certs](#generate-server-certs)

#### generate_server_certs

Use the `yugabyted cert generate_server_certs` sub-command to generate keys and certificates for the specified hostnames.

For example, to create node server certificates for hostnames 127.0.0.1, 127.0.0.2, 127.0.0.3, execute the following command:

```sh
./bin/yugabyted cert generate_server_certs --hostnames=127.0.0.1,127.0.0.2,127.0.0.3
```

#### Flags

-h | --help
: Print the command-line help and exit.

--hostnames *hostnames*
: Hostnames of the nodes to be added in the cluster. Mandatory flag.

--base_dir *base-directory*
: The base directory for the yugabyted server.

-----

### collect_logs

Use the `yugabyted collect_logs` command to generate a zipped file with all logs.

#### Syntax

```sh
Usage: yugabyted collect_logs [flags]
```

#### Flags

-h | --help
: Print the command-line help and exit.

--stdout
: Redirect the `logs.tar.gz` file's content to stdout. For example, `docker exec \<container-id\> bin/yugabyted collect_logs --stdout > yugabyted.tar.gz`

--base_dir *base-directory*
: The base directory for the yugabyted server whose logs are desired.

-----

### configure

Use the `yugabyted configure` command to do the following:

- Configure the data placement policy of the cluster.
- Enable or disable encryption at rest.
- Run yb-admin commands on a cluster.

#### Syntax

```sh
Usage: yugabyted configure [command] [flags]
```

#### Commands

The following sub-commands are available for `yugabyted configure` command:

- [data_placement](#data-placement)
- [encrypt_at_rest](#encrypt-at-rest)
- [admin_operation](#admin-operation)

#### data_placement

Use the `yugabyted configure data_placement` sub-command to set or modify placement policy of the nodes of the deployed cluster, and specify the preferred region(s).

For example, you would use the following command to create a multi-zone YugabyteDB cluster:

```sh
./bin/yugabyted configure data_placement --fault_tolerance=zone
```

##### data_placement flags

-h | --help
: Print the command-line help and exit.

--fault_tolerance *fault-tolerance*
: Specify the fault tolerance for the cluster. This flag can accept one of the following values: zone, region, cloud. For example, when the flag is set to zone (`--fault_tolerance=zone`), yugabyted applies zone fault tolerance to the cluster, placing the nodes in three different zones, if available.

--constraint_value *data-placement-constraint-value*
: Specify the data placement and preferred region(s) for the YugabyteDB cluster. This is an optional flag. The flag takes comma-separated values in the format `cloud.region.zone:priority`. The priority is an integer and is optional, and determines the preferred region(s) in order of preference. You must specify the same number of data placement values as the [replication factor](../../../architecture/docdb-replication/replication/#replication-factor).

--rf *replication-factor*
: Specify the replication factor for the cluster. This is an optional flag which takes a value of `3` or `5`.

--base_dir *base-directory*
: The base directory for the yugabyted server.

#### encrypt_at_rest

Use the `yugabyted configure encrypt_at_rest` sub-command to enable or disable [encryption at rest](../../../secure/encryption-at-rest/) for the deployed cluster.

To use encryption at rest, OpenSSL must be installed on the nodes.

For example, to enable encryption at rest for a deployed YugabyteDB cluster, execute the following:

```sh
./bin/yugabyted configure encrypt_at_rest --enable
```

To disable encryption at rest for a YugabyteDB cluster which has encryption at rest enabled, execute the following:

```sh
./bin/yugabyted configure encrypt_at_rest --disable
```

##### encrypt_at_rest flags

-h | --help
: Print the command-line help and exit.

--disable
: Disable encryption at rest for the cluster. There is no need to set a value for the flag. Use `--enable` or `--disable` flag to toggle encryption features on a YugabyteDB cluster.

--enable
: Enable encryption at rest for the cluster. There is no need to set a value for the flag. Use `--enable` or `--disable` flag to toggle encryption features on a YugabyteDB cluster.

--base_dir *base-directory*
: The base directory for the yugabyted server.

#### admin_operation

Use the `yugabyted configure admin_operation` command to run a yb-admin command on the YugabyteDB cluster.

For example, get the YugabyteDB universe configuration:

```sh
./bin/yugabyted configure admin_operation --command 'get_universe_config'
```

##### admin_operation flags

-h | --help
: Print the command-line help and exit.

--command *yb-admin-command*
: Specify the yb-admin command to be executed on the YugabyteDB cluster.

--master_addresses *master-addresses*
: Comma-separated list of current masters of the YugabyteDB cluster.

-----

### configure_read_replica

Use the `yugabyted configure_read_replica` command to configure, modify, or delete a [read replica cluster](../../../architecture/docdb-replication/read-replicas/).

#### Syntax

```text
Usage: yugabyted configure_read_replica [command] [flags]
```

#### Commands

The following sub-commands are available for the `yugabyted configure_read_replica` command:

- [new](#new)
- [modify](#modify)
- [delete](#delete)

#### new

Use the sub-command `yugabyted configure_read_replica new` to configure a new read replica cluster.

For example, to create a new read replica cluster, execute the following command:

```sh
./bin/yugabyted configure_read_replica new --rf=1 --data_placement_constraint=cloud1.region1.zone1
```

##### new flags

-h | --help
: Print the command-line help and exit.

--base_dir *base-directory*
: The base directory for the yugabyted server.

--rf *read-replica-replication-factor*
: Replication factor for the read replica cluster.

--data_placement_constraint *read-replica-constraint-value*
: Data placement constraint value for the read replica cluster. This is an optional flag. The flag takes comma-separated values in the format `cloud.region.zone:num_of_replicas`.

#### modify

Use the sub-command `yugabyted configure_read_replica modify` to modify an existing read replica cluster.

For example, modify a read replica cluster using the following commands.

Change the replication factor of the existing read replica cluster:

```sh
./bin/yugabyted configure_read_replica modify --rf=2

```

Change the replication factor and also specify the placement constraint:

```sh
./bin/yugabyted configure_read_replica modify --rf=2 --data_placement_constraint=cloud1.region1.zone1,cloud2.region2.zone2

```

##### modify flags

-h | --help
: Print the command-line help and exit.

--base_dir *base-directory*
: The base directory for the yugabyted server.

--rf *read-replica-replication-factor*
: Replication factor for the read replica cluster.

--data_placement_constraint *read-replica-constraint-value*
: Data placement constraint value for the read replica cluster. This is an optional flag. The flag takes comma-separated values in the format cloud.region.zone.

#### delete

Use the sub-command `yugabyted configure_read_replica delete` to delete an existing read replica cluster.

For example, delete a read replica cluster using the following command:

```sh
./bin/yugabyted configure_read_replica delete
```

##### delete flags

-h | --help
: Print the command-line help and exit.

--base_dir *base-directory*
: The base directory for the yugabyted server.

-----

### connect

Use the `yugabyted connect` command to connect to the cluster using [ysqlsh](../../../admin/ysqlsh/) or [ycqlsh](../../../admin/ycqlsh).

#### Syntax

```sh
Usage: yugabyted connect [command] [flags]
```

#### Commands

The following sub-commands are available for the `yugabyted connect` command:

- [ysql](#ysql)
- [ycql](#ycql)

#### ysql

Use the `yugabyted connect ysql` sub-command to connect to YugabyteDB with [ysqlsh](../../../admin/ysqlsh/).

#### ycql

Use the `yugabyted connect ycql` sub-command to connect to YugabyteDB with [ycqlsh](../../../admin/ycqlsh).

#### Flags

-h | --help
: Print the command-line help and exit.

--base_dir *base-directory*
: The base directory for the yugabyted server to connect to.

-----

### demo

Use the `yugabyted demo` command to use the demo [Northwind sample dataset](../../../sample-data/northwind/) with YugabyteDB.

#### Syntax

```sh
Usage: yugabyted demo [command] [flags]
```

#### Commands

The following sub-commands are available for the `yugabyted demo` command:

- [connect](#connect-1)
- [destroy](#destroy-1)

#### connect

Use the `yugabyted demo connect` sub-command to load the  [Northwind sample dataset](../../../sample-data/northwind/) into a new `yb_demo_northwind` SQL database, and then open the `ysqlsh` prompt for the same database.

#### destroy

Use the `yugabyted demo destroy` sub-command to shut down the yugabyted single-node cluster and remove data, configuration, and log directories. This sub-command also deletes the `yb_demo_northwind` database.

#### Flags

-h | --help
: Print the help message and exit.

--base_dir *base-directory*
: The base directory for the yugabyted server to connect to or destroy.

-----

### destroy

Use the `yugabyted destroy` command to delete a cluster.

#### Syntax

```sh
Usage: yugabyted destroy [flags]
```

For examples, see [Destroy a local cluster](#destroy-a-local-cluster).

#### Flags

-h | --help
: Print the command-line help and exit.

--base_dir *base-directory*
: The base directory for the yugabyted server that needs to be destroyed.

-----

### start

Use the `yugabyted start` command to start a one-node YugabyteDB cluster for running [YSQL](../../../api/ysql) and [YCQL](../../../api/ycql) workloads in your local environment.

To use encryption in transit, OpenSSL must be installed on the nodes.

#### Syntax

```text
Usage: yugabyted start [flags]
```

Examples:

Create a local single-node cluster:

```sh
./bin/yugabyted start
```

Create a local single-node cluster with encryption in transit and authentication:

```sh
./bin/yugabyted start --secure
```

Create a single-node locally and join other nodes that are part of the same cluster:

```sh
./bin/yugabyted start --join=host:port,[host:port]
```

#### Flags

-h | --help
: Print the command-line help and exit.

--advertise_address *bind-ip*
: IP address or local hostname on which yugabyted will listen.

--join *master-ip*
: The IP or DNS address of the existing yugabyted server that the new yugabyted server will join, or if the server was restarted, rejoin. The join flag accepts IP addresses, DNS names, or labels with correct [DNS syntax](https://en.wikipedia.org/wiki/Domain_Name_System#Domain_name_syntax,_internationalization) (that is, letters, numbers, and hyphens).

--config *config-file*
: yugabyted advanced configuration file path. Refer to [Advanced flags](#advanced-flags).

--base_dir *base-directory*
: The directory where yugabyted stores data, configurations, and logs. Must be an absolute path. By default base directory is `$HOME/var`.

--background *bool*
: Enable or disable running yugabyted in the background as a daemon. Does not persist on restart. Default: `true`

--cloud_location *cloud-location*
: Cloud location of the yugabyted node in the format `cloudprovider.region.zone`. This information is used for multi-zone, multi-region, and multi-cloud deployments of YugabyteDB clusters.

{{<tip title="Rack awareness">}}
For on-premises deployments, consider racks as zones to treat them as fault domains.
{{</tip>}}

--fault_tolerance *fault_tolerance*
: Determines the fault tolerance constraint to be applied on the data placement policy of the YugabyteDB cluster. This flag can accept the following values: none, zone, region, cloud.

--ui *bool*
: Enable or disable the webserver UI (available at <http://localhost:15433>). Default: `true`

--secure
: Enable [encryption in transit](../../../secure/tls-encryption/) and [authentication](../../../secure/enable-authentication/ysql/) for the node.
: Encryption in transit requires SSL/TLS certificates for each node in the cluster.
: - When starting a local single-node cluster, a certificate is automatically generated for the cluster.
: - When deploying a node in a multi-node cluster, you need to generate the certificate for the node using the `--cert generate_server_certs` command and copy it to the node *before* you start the node using the `--secure` flag, or the node creation will fail.
: When authentication is enabled, the default user is `yugabyte` in YSQL, and `cassandra` in YCQL. When a cluster is started,`yugabyted` outputs a message `Credentials File is stored at <credentials_file_path.txt>` with the credentials file location.
: For examples creating secure local multi-node, multi-zone, and multi-region clusters, refer to [Examples](#examples).

--read_replica *read_replica_node*
: Use this flag to start a read replica node.

--enable_pg_parity_early_access *PostgreSQL-compatibilty*
: Enable Enhanced PostgreSQL Compatibility Mode. Default: `false`

#### Advanced flags

Advanced flags can be set by using the configuration file in the `--config` flag. The advanced flags support for the `start` command is as follows:

--ycql_port *ycql-port*
: The port on which YCQL will run.

--ysql_port *ysql-port*
: The port on which YSQL will run.

--master_rpc_port *master-rpc-port*
: The port on which YB-Master will listen for RPC calls.

--tserver_rpc_port *tserver-rpc-port*
: The port on which YB-TServer will listen for RPC calls.

--master_webserver_port *master-webserver-port*
: The port on which YB-Master webserver will run.

--tserver_webserver_port *tserver-webserver-port*
: The port on which YB-TServer webserver will run.

--webserver_port *webserver-port*
: The port on which main webserver will run.

--callhome *bool*
: Enable or disable the *call home* feature that sends analytics data to Yugabyte. Default: `true`.

--data_dir *data-directory*
: The directory where yugabyted stores data. Must be an absolute path. Can be configured to a directory different from the one where configurations and logs are stored. By default, data directory is `<base_dir>/data`.

--log_dir *log-directory*
: The directory to store yugabyted logs. Must be an absolute path. This flag controls where the logs of the YugabyteDB nodes are stored. By default, logs are written to `<base_dir>/logs`.

--certs_dir *certs-directory*
: The path to the directory which has the certificates to be used for secure deployment. Must be an absolute path. Default path is `~/<base_dir>/certs`.

--master_flags *master_flags*
: Specify extra [master flags](../../../reference/configuration/yb-master#configuration-flags) as a set of key value pairs. Format (key=value,key=value).
: To specify any CSV value flags, enclose the values inside curly braces `{}`. Refer to [Pass additional flags to YB-Master and YB-TServer](#pass-additional-flags-to-yb-master-and-yb-tserver).

--tserver_flags *tserver_flags*
: Specify extra [tserver flags](../../../reference/configuration/yb-tserver#configuration-flags) as a set of key value pairs. Format (key=value,key=value).
: To specify any CSV value flags, enclose the values inside curly braces `{}`. Refer to [Pass additional flags to YB-Master and YB-TServer](#pass-additional-flags-to-yb-master-and-yb-tserver).

--ysql_enable_auth *bool*
: Enable or disable YSQL authentication. Default: `false`.
: If the `YSQL_PASSWORD` [environment variable](#environment-variables) exists, then authentication mode is automatically set to `true`.

--use_cassandra_authentication *bool*
: Enable or disable YCQL authentication. Default: `false`.
: If the `YCQL_USER` or `YCQL_PASSWORD` [environment variables](#environment-variables) exist, then authentication mode is automatically set to `true`.
: Note that the corresponding environment variables have higher priority than the command-line flags.

--initial_scripts_dir *initial-scripts-dir*
: The directory from where yugabyted reads initialization scripts.
: Script format - YSQL `.sql`, YCQL `.cql`.
: Initialization scripts are executed in sorted name order.

#### Deprecated flags

--daemon *bool*
: Enable or disable running yugabyted in the background as a daemon. Does not persist on restart. Use [--background](#flags) instead. Default: `true`.

--listen *bind-ip*
: The IP address or localhost name to which yugabyted will listen.

-----

### status

Use the `yugabyted status` command to check the status.

#### Syntax

```sh
Usage: yugabyted status [flags]
```

#### Flags

-h | --help
: Print the command-line help and exit.

--base_dir *base-directory*
: The base directory for the yugabyted server whose status is desired.

-----

### stop

Use the `yugabyted stop` command to stop a YugabyteDB cluster.

#### Syntax

```sh
Usage: yugabyted stop [flags]
```

#### Flags

-h | --help
: Print the command-line help and exit.

--base_dir *base-directory*
: The base directory for the yugabyted server that needs to be stopped.

-----

### version

Use the `yugabyted version` command to check the version number.

#### Syntax

```sh
Usage: yugabyted version [flags]
```

#### Flags

-h | --help
: Print the command-line help and exit.

--base_dir *base-directory*
: The base directory for the yugabyted server whose version is desired.

-----

## Environment variables

In the case of multi-node deployments, all nodes should have similar environment variables.

Changing the values of the environment variables after the first run has no effect.

### YSQL

Set `YSQL_PASSWORD` to use the cluster in enforced authentication mode.

The following are combinations of environment variables and their uses:

- `YSQL_PASSWORD`

  Update the default yugabyte user's password.

- `YSQL_PASSWORD, YSQL_DB`

  Update the default yugabyte user's password and create `YSQL_DB` named DB.

- `YSQL_PASSWORD, YSQL_USER`

  Create `YSQL_USER` named user and DB with password `YSQL_PASSWORD`.

- `YSQL_USER`

  Create `YSQL_USER` named user and DB with password `YSQL_USER`.

- `YSQL_USER, YSQL_DB`

  Create `YSQL_USER` named user with password `YSQL_USER` and `YSQL_DB` named DB.

- `YSQL_DB`

  Create `YSQL_DB` named DB.

- `YSQL_USER, YSQL_PASSWORD, YSQL_DB`

  Create `YSQL_USER` named user with password `YSQL_PASSWORD` and `YSQL_DB` named DB.

### YCQL

Set `YCQL_USER` or `YCQL_PASSWORD` to use the cluster in enforced authentication mode.

The following are combinations of environment variables and their uses:

- `YCQL_PASSWORD`

  Update the default cassandra user's password.

- `YCQL_PASSWORD, YCQL_KEYSPACE`

  Update the default cassandra user's password and create `YCQL_KEYSPACE` named keyspace.

- `YCQL_PASSWORD, YCQL_USER`

  Create `YCQL_USER` named user and DB with password `YCQL_PASSWORD`.

- `YCQL_USER`

  Create `YCQL_USER` named user and DB with password `YCQL_USER`.

- `YCQL_USER, YCQL_KEYSPACE`

  Create `YCQL_USER` named user with password `YCQL_USER` and `YCQL_USER` named keyspace.

- `YCQL_KEYSPACE`

  Create `YCQL_KEYSPACE` named keyspace.

- `YCQL_USER, YCQL_PASSWORD, YCQL_KEYSPACE`

  Create `YCQL_USER` named user with password `YCQL_PASSWORD` and `YCQL_KEYSPACE` named keyspace.

-----

## Examples

To deploy any type of secure cluster (that is, using the `--secure` flag) or use encryption at rest, OpenSSL must be installed on your machine.

### Running on macOS

#### Port conflicts

macOS Monterey enables AirPlay receiving by default, which listens on port 7000. This conflicts with YugabyteDB and causes `yugabyted start` to fail. Use the [--master_webserver_port flag](#advanced-flags) when you start the cluster to change the default port number, as follows:

```sh
./bin/yugabyted start --master_webserver_port=9999
```

Alternatively, you can disable AirPlay receiving, then start YugabyteDB normally, and then, optionally, re-enable AirPlay receiving.

#### Loopback addresses

On macOS, every additional node after the first needs a loopback address configured to simulate the use of multiple hosts or nodes. For example, for a three-node cluster, you add two additional addresses as follows:

```sh
sudo ifconfig lo0 alias 127.0.0.2
sudo ifconfig lo0 alias 127.0.0.3
```

The loopback addresses do not persist upon rebooting your computer.

### Destroy a local cluster

If you are running YugabyteDB on your local computer, you can't run more than one cluster at a time. To set up a new local YugabyteDB cluster using yugabyted, first destroy the currently running cluster.

To destroy a local single-node cluster, use the [destroy](#destroy-1) command as follows:

```sh
./bin/yugabyted destroy
```

To destroy a local multi-node cluster, use the `destroy` command with the `--base_dir` flag set to the base directory path of each of the nodes. For example, for a three node cluster, you would execute commands similar to the following:

{{%cluster/cmd op="destroy" nodes="1,2,3"%}}

```sh
./bin/yugabyted destroy --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node1
./bin/yugabyted destroy --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node2
./bin/yugabyted destroy --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node3
```

If the cluster has more than three nodes, execute a `destroy --base_dir=<path to directory>` command for each additional node until all nodes are destroyed.

### Create a single-node cluster

Create a single-node cluster with a given base directory. Note the need to provide a fully-qualified directory path for the `base_dir` parameter.

```sh
./bin/yugabyted start --advertise_address=127.0.0.1 \
    --base_dir=/Users/username/yugabyte-{{< yb-version version="v2.20" >}}/data1
```

To create secure single-node cluster with [encryption in transit](../../../secure/tls-encryption/) and [authentication](../../../secure/enable-authentication/ysql/) enabled, add the `--secure` flag as follows:

```sh
./bin/yugabyted start --secure --advertise_address=127.0.0.1 \
    --base_dir=/Users/username/yugabyte-{{< yb-version version="v2.20" >}}/data1
```

When authentication is enabled, the default user and password is `yugabyte` and `yugabyte` in YSQL, and `cassandra` and `cassandra` in YCQL.

### Create certificates for a secure local multi-node cluster

Secure clusters use [encryption in transit](../../../secure/tls-encryption/), which requires SSL/TLS certificates for each node in the cluster. Generate the certificates using the `--cert generate_server_certs` command and then copy them to the respective node base directories *before* you create a secure local multi-node cluster.

Create the certificates for SSL and TLS connection:

```sh
./bin/yugabyted cert generate_server_certs --hostnames=127.0.0.1,127.0.0.2,127.0.0.3
```

Certificates are generated in the `<HOME>/var/generated_certs/<hostname>` directory.

Copy the certificates to the respective node's `<base_dir>/certs` directory:

```sh
cp $HOME/var/generated_certs/127.0.0.1/* $HOME/yugabyte-{{< yb-version version="v2.20" >}}/node1/certs
cp $HOME/var/generated_certs/127.0.0.2/* $HOME/yugabyte-{{< yb-version version="v2.20" >}}/node2/certs
cp $HOME/var/generated_certs/127.0.0.3/* $HOME/yugabyte-{{< yb-version version="v2.20" >}}/node3/certs
```

### Create a local multi-node cluster

To create a cluster with multiple nodes, you first create a single node, and then create additional nodes using the `--join` flag to add them to the cluster. If a node is restarted, you would also use the `--join` flag to rejoin the cluster.

To create a secure multi-node cluster, ensure you have [generated and copied the certificates](#create-certificates-for-a-secure-local-multi-node-cluster) for each node.

To create a cluster without encryption and authentication, omit the `--secure` flag.

To create the cluster, do the following:

1. Start the first node by running the following command:

    ```sh
    ./bin/yugabyted start --secure --advertise_address=127.0.0.1 \
        --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node1 \
        --cloud_location=aws.us-east-1.us-east-1a
    ```

1. On macOS, configure loopback addresses for the additional nodes as follows:

    ```sh
    sudo ifconfig lo0 alias 127.0.0.2
    sudo ifconfig lo0 alias 127.0.0.3
    ```

1. Add two more nodes to the cluster using the `--join` flag, as follows:

    ```sh
    ./bin/yugabyted start --secure --advertise_address=127.0.0.2 \
        --join=127.0.0.1 \
        --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node2 \
        --cloud_location=aws.us-east-1.us-east-1b
    ./bin/yugabyted start --secure --advertise_address=127.0.0.3 \
        --join=127.0.0.1 \
        --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node3 \
        --cloud_location=aws.us-east-1.us-east-1c
    ```

### Create a multi-zone cluster

{{< tabpane text=true >}}

  {{% tab header="Secure" lang="secure" %}}

To create a secure multi-zone cluster:

1. Start the first node by running the `yugabyted start` command, using the `--secure` flag and passing in the `--cloud_location` and `--fault_tolerance` flags to set the node location details, as follows:

    ```sh
    ./bin/yugabyted start --secure --advertise_address=<host-ip> \
        --cloud_location=aws.us-east-1.us-east-1a \
        --fault_tolerance=zone
    ```

1. Create certificates for the second and third virtual machine (VM) for SSL and TLS connection, as follows:

    ```sh
    ./bin/yugabyted cert generate_server_certs --hostnames=<IP_of_VM_2>,<IP_of_VM_3>
    ```

1. Manually copy the generated certificates in the first VM to the second and third VM, as follows:

    - Copy the certificates for the second VM from `$HOME/var/generated_certs/<IP_of_VM_2>` in the first VM to `$HOME/var/certs` in the second VM.

    - Copy the certificates for the third VM from `$HOME/var/generated_certs/<IP_of_VM_3>` in first VM to `$HOME/var/certs` in the third VM.

1. Start the second and the third node on two separate VMs using the `--join` flag, as follows:

    ```sh
    ./bin/yugabyted start --secure --advertise_address=<host-ip> \
        --join=<ip-address-first-yugabyted-node> \
        --cloud_location=aws.us-east-1.us-east-1b \
        --fault_tolerance=zone
    ```

    ```sh
    ./bin/yugabyted start --secure --advertise_address=<host-ip> \
        --join=<ip-address-first-yugabyted-node> \
        --cloud_location=aws.us-east-1.us-east-1c \
        --fault_tolerance=zone
    ```

  {{% /tab %}}

  {{% tab header="Insecure" lang="basic" %}}

To create a multi-zone cluster:

1. Start the first node by running the `yugabyted start` command, passing in the `--cloud_location` and `--fault_tolerance` flags to set the node location details, as follows:

    ```sh
    ./bin/yugabyted start --advertise_address=<host-ip> \
        --cloud_location=aws.us-east-1.us-east-1a \
        --fault_tolerance=zone
    ```

1. Start the second and the third node on two separate VMs using the `--join` flag, as follows:

    ```sh
    ./bin/yugabyted start --advertise_address=<host-ip> \
        --join=<ip-address-first-yugabyted-node> \
        --cloud_location=aws.us-east-1.us-east-1b \
        --fault_tolerance=zone
    ```

    ```sh
    ./bin/yugabyted start --advertise_address=<host-ip> \
        --join=<ip-address-first-yugabyted-node> \
        --cloud_location=aws.us-east-1.us-east-1c \
        --fault_tolerance=zone
    ```

  {{% /tab %}}

{{< /tabpane >}}

After starting the yugabyted processes on all the nodes, configure the data placement constraint of the cluster as follows:

```sh
./bin/yugabyted configure data_placement --fault_tolerance=zone
```

The preceding command automatically determines the data placement constraint based on the `--cloud_location` of each node in the cluster. If there are three or more zones available in the cluster, the `configure` command configures the cluster to survive at least one availability zone failure. Otherwise, it outputs a warning message.

The replication factor of the cluster defaults to 3.

You can set the data placement constraint manually using the `--constraint_value` flag, which takes the comma-separated value of `cloud.region.zone`. For example:

```sh
./bin/yugabyted configure data_placement --fault_tolerance=zone \
    --constraint_value=aws.us-east-1.us-east-1a,aws.us-east-1.us-east-1b,aws.us-east-1.us-east-1c \
```

You can set the replication factor of the cluster manually using the `--rf` flag. For example:

```sh
./bin/yugabyted configure data_placement --fault_tolerance=zone \
    --constraint_value=aws.us-east-1.us-east-1a,aws.us-east-1.us-east-1b,aws.us-east-1.us-east-1c \
    --rf=3
```

### Create a multi-region cluster

{{< tabpane text=true >}}

  {{% tab header="Secure" lang="secure-2" %}}

To create a secure multi-region cluster:

1. Start the first node by running the `yugabyted start` command, using the `--secure` flag and passing in the `--cloud_location` and `--fault_tolerance` flags to set the node location details, as follows:

    ```sh
    ./bin/yugabyted start --secure --advertise_address=<host-ip> \
        --cloud_location=aws.us-east-1.us-east-1a \
        --fault_tolerance=region
    ```

1. Create certificates for the second and third virtual machine (VM) for SSL and TLS connection, as follows:

    ```sh
    ./bin/yugabyted cert generate_server_certs --hostnames=<IP_of_VM_2>,<IP_of_VM_3>
    ```

1. Manually copy the generated certificates in the first VM to the second and third VM:

    - Copy the certificates for the second VM from `$HOME/var/generated_certs/<IP_of_VM_2>` in the first VM to `$HOME/var/certs` in the second VM.
    - Copy the certificates for third VM from `$HOME/var/generated_certs/<IP_of_VM_3>` in first VM to `$HOME/var/certs` in the third VM.

1. Start the second and the third node on two separate VMs using the `--join` flag, as follows:

    ```sh
    ./bin/yugabyted start --secure --advertise_address=<host-ip> \
        --join=<ip-address-first-yugabyted-node> \
        --cloud_location=aws.us-west-1.us-west-1a \
        --fault_tolerance=region
    ```

    ```sh
    ./bin/yugabyted start --secure --advertise_address=<host-ip> \
        --join=<ip-address-first-yugabyted-node> \
        --cloud_location=aws.us-central-1.us-central-1a \
        --fault_tolerance=region
    ```

  {{% /tab %}}

  {{% tab header="Insecure" lang="basic-2" %}}

To create a multi-region cluster:

1. Start the first node by running the `yugabyted start` command, pass in the `--cloud_location` and `--fault_tolerance` flags to set the node location details, as follows:

    ```sh
    ./bin/yugabyted start --advertise_address=<host-ip> \
        --cloud_location=aws.us-east-1.us-east-1a \
        --fault_tolerance=region
    ```

1. Start the second and the third node on two separate VMs using the `--join` flag, as follows:

    ```sh
    ./bin/yugabyted start --advertise_address=<host-ip> \
        --join=<ip-address-first-yugabyted-node> \
        --cloud_location=aws.us-west-1.us-west-1a \
        --fault_tolerance=region
    ```

    ```sh
    ./bin/yugabyted start --advertise_address=<host-ip> \
        --join=<ip-address-first-yugabyted-node> \
        --cloud_location=aws.us-central-1.us-central-1a \
        --fault_tolerance=region
    ```

  {{% /tab %}}

{{< /tabpane >}}

After starting the yugabyted processes on all nodes, configure the data placement constraint of the cluster as follows:

```sh
./bin/yugabyted configure data_placement --fault_tolerance=region
```

The preceding command automatically determines the data placement constraint based on the `--cloud_location` of each node in the cluster. If there are three or more regions available in the cluster, the `configure` command configures the cluster to survive at least one availability region failure. Otherwise, it outputs a warning message.

The replication factor of the cluster defaults to 3.

You can set the data placement constraint manually using the `--constraint_value` flag, which takes the comma-separated value of `cloud.region.zone`. For example:

```sh
./bin/yugabyted configure data_placement \
    --fault_tolerance=region \
    --constraint_value=aws.us-east-1.us-east-1a,aws.us-west-1.us-west-1a,aws.us-central-1.us-central-1a
```

You can set the replication factor of the cluster manually using the `--rf` flag. For example:

```sh
./bin/yugabyted configure data_placement \
    --fault_tolerance=region \
    --constraint_value=aws.us-east-1.us-east-1a,aws.us-west-1.us-west-1a,aws.us-central-1.us-central-1a \
    --rf=3
```

### Create a multi-region cluster in Docker

You can run yugabyted in a Docker container. For more information, see the [Quick Start](/preview/tutorials/quick-start/docker/).

The following example shows how to create a multi-region cluster. If the `~/yb_docker_data` directory already exists, delete and re-create it.

Note that the `--join` flag only accepts labels that conform to DNS syntax, so name your Docker container accordingly using only letters, numbers, and hyphens.

```sh
rm -rf ~/yb_docker_data
mkdir ~/yb_docker_data

docker network create yb-network

docker run -d --name yugabytedb-node1 --hostname yugabytedb-node1 --net yb-network \
    -p 15433:15433 -p 7001:7000 -p 9001:9000 -p 5433:5433 \
    -v ~/yb_docker_data/node1:/home/yugabyte/yb_data --restart unless-stopped \
    yugabytedb/yugabyte:{{< yb-version version="preview" format="build">}} \
    bin/yugabyted start \
    --base_dir=/home/yugabyte/yb_data --background=false

docker run -d --name yugabytedb-node2 --hostname yugabytedb-node2 --net yb-network \
    -p 15434:15433 -p 7002:7000 -p 9002:9000 -p 5434:5433 \
    -v ~/yb_docker_data/node2:/home/yugabyte/yb_data --restart unless-stopped \
    yugabytedb/yugabyte:{{< yb-version version="preview" format="build">}} \
    bin/yugabyted start --join=yugabytedb-node1 \
    --base_dir=/home/yugabyte/yb_data --background=false

docker run -d --name yugabytedb-node3 --hostname yugabytedb-node3 --net yb-network \
    -p 15435:15433 -p 7003:7000 -p 9003:9000 -p 5435:5433 \
    -v ~/yb_docker_data/node3:/home/yugabyte/yb_data --restart unless-stopped \
    yugabytedb/yugabyte:{{< yb-version version="preview" format="build">}} \
    bin/yugabyted start --join=yugabytedb-node1 \
    --base_dir=/home/yugabyte/yb_data --background=false
```

### Create and manage read replica clusters

To create a read replica cluster, you first create a YugabyteDB cluster; this example assumes a 3-node cluster is deployed. Refer to [Create a local multi-node cluster](#create-a-local-multi-node-cluster).

You add read replica nodes to the primary cluster using the `--join` and `--read_replica` flags.

#### Create a read replica cluster

{{< tabpane text=true >}}

  {{% tab header="Secure" lang="secure-2" %}}

To create a secure read replica cluster, generate and copy the certificates for each read replica node, similar to how you create [certificates for local multi-node cluster](#create-certificates-for-a-secure-local-multi-node-cluster).

```sh
./bin/yugabyted cert generate_server_certs --hostnames=127.0.0.4,127.0.0.5,127.0.0.6,127.0.0.7,127.0.0.8
```

Copy the certificates to the respective read replica nodes in the `<base_dir>/certs` directory:

```sh
cp $HOME/var/generated_certs/127.0.0.4/* $HOME/yugabyte-{{< yb-version version="v2.20" >}}/node4/certs
cp $HOME/var/generated_certs/127.0.0.5/* $HOME/yugabyte-{{< yb-version version="v2.20" >}}/nod45/certs
cp $HOME/var/generated_certs/127.0.0.6/* $HOME/yugabyte-{{< yb-version version="v2.20" >}}/node6/certs
cp $HOME/var/generated_certs/127.0.0.7/* $HOME/yugabyte-{{< yb-version version="v2.20" >}}/node7/certs
cp $HOME/var/generated_certs/127.0.0.8/* $HOME/yugabyte-{{< yb-version version="v2.20" >}}/node8/certs
```

To create the read replica cluster, do the following:

1. On macOS, configure loopback addresses for the additional nodes as follows:

    ```sh
    sudo ifconfig lo0 alias 127.0.0.4
    sudo ifconfig lo0 alias 127.0.0.5
    sudo ifconfig lo0 alias 127.0.0.6
    sudo ifconfig lo0 alias 127.0.0.7
    sudo ifconfig lo0 alias 127.0.0.8
    ```

1. Add read replica nodes using the `--join` and `--read_replica` flags, as follows:

    ```sh
    ./bin/yugabyted start \
        --secure \
        --advertise_address=127.0.0.4 \
        --join=127.0.0.1 \
        --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node4 \
        --cloud_location=aws.us-east-1.us-east-1d \
        --read_replica

    ./bin/yugabyted start \
        --secure \
        --advertise_address=127.0.0.5 \
        --join=127.0.0.1 \
        --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node5 \
        --cloud_location=aws.us-east-1.us-east-1d \
        --read_replica

    ./bin/yugabyted start \
        --secure \
        --advertise_address=127.0.0.6 \
        --join=127.0.0.1 \
        --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node6 \
        --cloud_location=aws.us-east-1.us-east-1e \
        --read_replica

    ./bin/yugabyted start \
        --secure \
        --advertise_address=127.0.0.7 \
        --join=127.0.0.1 \
        --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node7 \
        --cloud_location=aws.us-east-1.us-east-1f \
        --read_replica

    ./bin/yugabyted start \
        --secure \
        --advertise_address=127.0.0.8 \
        --join=127.0.0.1 \
        --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node8 \
        --cloud_location=aws.us-east-1.us-east-1f \
        --read_replica
    ```

  {{% /tab %}}

  {{% tab header="Insecure" lang="basic-2" %}}

To create the read replica cluster, do the following:

1. On macOS, configure loopback addresses for the additional nodes as follows:

    ```sh
    sudo ifconfig lo0 alias 127.0.0.4
    sudo ifconfig lo0 alias 127.0.0.5
    sudo ifconfig lo0 alias 127.0.0.6
    sudo ifconfig lo0 alias 127.0.0.7
    sudo ifconfig lo0 alias 127.0.0.8
    ```

1. Add read replica nodes using the `--join` and `--read_replica` flags, as follows:

    ```sh
    ./bin/yugabyted start \
        --advertise_address=127.0.0.4 \
        --join=127.0.0.1 \
        --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node4 \
        --cloud_location=aws.us-east-1.us-east-1d \
        --read_replica

    ./bin/yugabyted start \
        --advertise_address=127.0.0.5 \
        --join=127.0.0.1 \
        --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node5 \
        --cloud_location=aws.us-east-1.us-east-1d \
        --read_replica

    ./bin/yugabyted start \
        --advertise_address=127.0.0.6 \
        --join=127.0.0.1 \
        --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node6 \
        --cloud_location=aws.us-east-1.us-east-1e \
        --read_replica

    ./bin/yugabyted start \
        --advertise_address=127.0.0.7 \
        --join=127.0.0.1 \
        --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node7 \
        --cloud_location=aws.us-east-1.us-east-1f \
        --read_replica

    ./bin/yugabyted start \
        --advertise_address=127.0.0.8 \
        --join=127.0.0.1 \
        --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node8 \
        --cloud_location=aws.us-east-1.us-east-1f \
        --read_replica
    ```

  {{% /tab %}}

{{< /tabpane >}}

#### Configure a new read replica cluster

After starting all read replica nodes, configure the read replica cluster using `configure_read_replica new` command as follows:

```sh
./bin/yugabyted configure_read_replica new --base_dir ~/yb-cluster/node4
```

The preceding command automatically determines the data placement constraint based on the `--cloud_location` of each node in the cluster. After the command is run, the primary cluster will begin asynchronous replication with the read replica cluster.

You can set the data placement constraint manually and specify the number of replicas in each cloud location using the `--data_placement_constraint` flag, which takes the comma-separated value of `cloud.region.zone:num_of_replicas`. For example:

```sh
./bin/yugabyted configure_read_replica new \
    --base_dir ~/yb-cluster/node4 \
    --constraint_value=aws.us-east-1.us-east-1d:1,aws.us-east-1.us-east-1e:1,aws.us-east-1.us-east-1d:1
```

When specifying the `--data_placement_constraint` flag, you must provide the following:

- include all the zones where a read replica node is to be placed.
- specify the number of replicas for each zone; each zone should have at least one read replica node.

    The number of replicas in any cloud location should be less than or equal to the number of read replica nodes deployed in that cloud location.

The replication factor of the read replica cluster defaults to the number of different cloud locations containing read replica nodes; that is, one replica in each cloud location.

You can set the replication factor manually using the `--rf` flag. For example:

```sh
./bin/yugabyted configure_read_replica new \
    --base_dir ~/yb-cluster/node4 \
    --rf <replication_factor>
```

When specifying the `--rf` flag:

- If the `--data_placement_constraint` flag is provided
  - All rules for using the `--data_placement_constraint` flag apply.
  - Replication factor should be equal the number of replicas specified using the `--data_placement_constraint` flag.
- If the `--data_placement_constraint` flag is not provided:
  - Replication factor should be less than or equal to total read replica nodes deployed.
  - Replication factor should be greater than or equal to number of cloud locations that have a read replica node; that is, there should be at least one replica in each cloud location.

#### Modifying a configured read replica cluster

You can modify an existing read replica cluster configuration using the `configure_read_replica modify` command and specifying new values for the `--data_placement_constraint` and `--rf` flags.

For example:

```sh
./yugabyted configure_read_replica modify \
--base_dir=~/yb-cluster/node4 \
--data_placement_constraint=aws.us-east-1.us-east-1d:2,aws.us-east-1.us-east-1e:1,aws.us-east-1.us-east-1d:2
```

This changes the data placement configuration of the read replica cluster to have 2 replicas in `aws.us-east-1.us-east-1d` cloud location as compared to one replica set in the original configuration.

When specifying new `--data_placement_constraint` or `--rf` values, the same rules apply.

#### Delete a read replica cluster

To delete a read replica cluster, destroy all read replica nodes using the `destroy` command:

```sh
./bin/yugabyted destroy --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node4
./bin/yugabyted destroy --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node5
./bin/yugabyted destroy --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node6
./bin/yugabyted destroy --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node7
./bin/yugabyted destroy --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node8
```

After destroying the nodes, run the `configure_read_replica delete` command to delete the read replica configuration:

```sh
./bin/yugabyted configure_read_replica delete --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node1
```

### Enable and disable encryption at rest

To enable [encryption at rest](../../../secure/encryption-at-rest/) in a deployed local cluster, run the following command:

```sh
./bin/yugabyted configure encrypt_at_rest \
    --enable \
    --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node1
```

To enable encryption at rest in a deployed multi-zone or multi-region cluster, run the following command from any VM:

```sh
./bin/yugabyted configure encrypt_at_rest --enable
```

To disable encryption at rest in a local cluster with encryption at rest enabled, run the following command:

```sh
./bin/yugabyted configure encrypt_at_rest \
    --disable \
    --base_dir=$HOME/yugabyte-{{< yb-version version="v2.20" >}}/node1
```

To disable encryption at rest in a multi-zone or multi-region cluster with this type of encryption enabled, run the following command from any VM:

```sh
./bin/yugabyted configure encrypt_at_rest --disable
```

### Pass additional flags to YB-TServer

Create a single-node cluster and set additional flags for the YB-TServer process:

```sh
./bin/yugabyted start --tserver_flags="pg_yb_session_timeout_ms=1200000,ysql_max_connections=400"
```

## Upgrade a YugabyteDB cluster

To use the latest features of the database and apply the latest security fixes, upgrade your YugabyteDB cluster to the [latest release](https://download.yugabyte.com/#/).

Upgrading an existing YugabyteDB cluster that was deployed using yugabyted includes the following steps:

1. Stop the running YugabyteDB node using the `yugabyted stop` command.

    ```sh
    ./bin/yugabyted stop --base_dir <path_to_base_dir>
    ```

1. Start the new yugabyted process by executing the `yugabyted start` command. Use the previously configured `--base_dir` when restarting the instance.

Repeat the steps on all the nodes of the cluster, one node at a time.

### Upgrade a cluster from single to multi zone

The following steps assume that you have a running YugabyteDB cluster deployed using yugabyted, and have downloaded the update:

1. Stop the first node by using `yugabyted stop` command:

    ```sh
    ./bin/yugabyted stop
    ```

1. Start the YugabyteDB node by using `yugabyted start` command by providing the necessary cloud information as follows:

    ```sh
    ./bin/yugabyted start --advertise_address=<host-ip> \
      --cloud_location=aws.us-east-1.us-east-1a \
      --fault_tolerance=zone
    ```

1. Repeat the previous step on all the nodes of the cluster, one node at a time. If you are deploying the cluster on your local computer, specify the base directory for each node using the `--base-dir` flag.

1. After starting all nodes, specify the data placement constraint on the cluster using the following command:

    ```sh
    ./bin/yugabyted configure data_placement --fault_tolerance=zone
    ```

    To manually specify the data placement constraint, use the following command:

    ```sh
    ./bin/yugabyted configure data_placement \
      --fault_tolerance=zone \
      --constraint_value=aws.us-east-1.us-east-1a,aws.us-east-1.us-east-1b,aws.us-east-1.us-east-1c \
      --rf=3
    ```
