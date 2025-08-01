---
title: YSQL API reference
headerTitle: YSQL API reference
linkTitle: YSQL
description: Learn about Yugabyte Structured Query Language (YSQL), the distributed SQL API for the PostgreSQL compatible YugabyteDB database.
summary: Reference for the YSQL API
headcontent: PostgreSQL-compatible API
showRightNav: true
type: indexpage
---
<!--menu:
  stable_api:
    parent: api
    identifier: api-ysql
    weight: 10
-->
## Introduction

Yugabyte Structured Query Language (YSQL) is an ANSI SQL, fully-relational API that is best fit for scale-out RDBMS applications that need ultra resilience, massive write scalability, and geographic data distribution. The YugabyteDB SQL processing layer is built by using the [PostgreSQL](https://www.yugabyte.com/postgresql/) code (version 15) directly. The result of this approach is that [YSQL is fully compatible with PostgreSQL _by construction_](https://www.yugabyte.com/postgresql/postgresql-compatibility/).

YSQL therefore supports all of the traditional relational modeling features, such as referential integrity (implemented using a foreign key constraint from a child table to a primary key to its parent table), joins, partial indexes, triggers, and stored procedures. It extends the familiar transactional notions into the YugabyteDB Distributed SQL Database architecture.

If you don't find what you're looking for in the YSQL documentation, you might find answers in the relevant [PostgreSQL documentation](https://www.postgresql.org/docs/15/index.html). Successive YugabyteDB releases honor PostgreSQL syntax and semantics, although some features (for example those that are specific to the PostgreSQL monolithic SQL database architecture) might not be supported for distributed SQL. The YSQL documentation specifies the supported syntax and extensions.

To find the version of the PostgreSQL processing layer used in YugabyteDB, you can use the `version()` function. The following YSQL query displays only the first part of the returned value:

```plpgsql
select rpad(version(), 18)||'...' as v;
```

```output
           v
-----------------------
 PostgreSQL 15.2-YB...
```

## YSQL components

The main components of YSQL include:

- Data definition language (DDL)
- Data manipulation language (DML)
- Data control language (DCL)
- Built-in SQL functions
- PL/pgSQL procedural language for stored procedures

These components depend on underlying features like the data type system (common for both SQL and PL/pgSQL), expressions, database objects with qualified names, and comments. Other components support purposes such as system control, transaction control, and performance tuning.

### The SQL language

The section [The SQL language](./the-sql-language/) describes of all of the YugabyteDB SQL statements. Each statement has its own dedicated page. Each page starts with a formal specification of the syntax: both as a _railroad diagram_; and as a _grammar_ using the PostgreSQL convention. Then it explains the semantics and illustrates the explanation with code examples.

### Supporting language elements

This section lists the main elements that support the YugabyteDB SQL language subsystem.

- [Keywords](keywords/).
- Names and Qualifiers. Some names are reserved for the system. List of [reserved names](reserved_names/).
- [Data types](datatypes/). Most PostgreSQL-compatible data types are supported.
- [Built-in SQL functions](exprs/).

## Quick Start

You can explore the basics of the YSQL API using the [Quick Start](/preview/tutorials/quick-start/macos/).

It always helps to have access to a sandbox YugabyteDB cluster where you can, when you need to, do whatever you want without considering any risk of doing harm. Here are the kinds of things you'll want to do:

- Connect as the _postgres_ role and create and drop other _superusers_, and regular roles.
- Create and drop databases
- Create and drop extensions
- Create and drop objects of all other kinds

With these freedoms, you'll be able to set up any regime that you need to help you illustrate, or test, a hypothesis about how things work.

Moreover, for some experiments, you'll need operating system access so that you can make changes to various configuration files (like the one that determines the default values for session parameters).

It also helps to have a vanilla PostgreSQL installation on the same server so that you can confirm for yourself that the SQL systems of each (at least for the functionality that application developers use, and in the overwhelming majority of cases) are syntactically and semantically identical.

To do all this confidently, you need to be sure that nobody else can use your sandbox so that you know that everything that you observe will be explained by what you deliberately did. Occasionally, you'll even want to destroy a cluster at one version and replace it with a cluster at a different version.

The simplest way to achieve this ideal sandbox regime is to use your own laptop. The [Quick Start](/preview/tutorials/quick-start/macos/) shows you how to do this.
