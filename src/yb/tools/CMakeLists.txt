# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
# The following only applies to changes made to this file as part of YugaByte development.
#
# Portions Copyright (c) YugaByte, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License.  You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied.  See the License for the specific language governing permissions and limitations
# under the License.
#

set(YB_PCH_PREFIX tools)
set(YB_PCH_DEP_LIBS yb_test_util boost_program_options)

set(LINK_LIBS
  yb_client
  yb_common
  yb_util
  gutil
  ${YB_BASE_LIBS}
)

add_library(yb_tools_util
  data_gen_util.cc)
target_link_libraries(yb_tools_util
  ${LINK_LIBS})

add_executable(insert-generated-rows insert-generated-rows.cc)
target_link_libraries(insert-generated-rows
  yb_tools_util
  ${LINK_LIBS})

add_executable(yb-admin
  yb-admin_cli.cc)
target_link_libraries(yb-admin
  yb-admin_lib
  master_error
  master_util
  ${LINK_LIBS})

add_library(yb-admin_lib
  yb-admin_client.cc
  yb-admin_util.cc)
target_link_libraries(yb-admin_lib
  encryption
  ${LINK_LIBS})

add_executable(yb-ts-cli ts-cli.cc)
target_link_libraries(yb-ts-cli
  server_base_proto
  ${LINK_LIBS})

add_executable(data-patcher data-patcher.cc)
target_link_libraries(data-patcher boost_program_options yb_util yb_docdb log_proto log)

add_library(fs_tool fs_tool.cc)
target_link_libraries(fs_tool
  gutil
  yb_common
  server_common
  consensus
  tablet)

add_executable(ldb ldb.cc)
target_link_libraries(ldb
  rocksdb_tools
  yb_docdb)

add_executable(rocksdb_dump rocksdb_dump.cc)
target_link_libraries(rocksdb_dump
  rocksdb
  rocksdb_tools
  yb_docdb)

add_executable(sst_dump sst_dump.cc)
target_link_libraries(sst_dump
  rocksdb_tools
  yb_docdb
  tablet_metadata)

add_executable(yb-fs_list fs_list-tool.cc)
target_link_libraries(yb-fs_list
  ${LINK_LIBS}
  fs_tool)

add_executable(yb-fs_dump fs_dump-tool.cc)
target_link_libraries(yb-fs_dump
  ${LINK_LIBS}
  fs_tool)

add_library(ysck
    ysck.cc
    ysck_remote.cc
)
target_link_libraries(ysck
  yb_client
  master_proto
  server_base_proto
  tserver_proto
  tserver_service_proto
  ${YB_BASE_LIBS}
)
add_dependencies(
  ysck
  gen_src_yb_consensus_log_proto)

add_executable(yb-ysck yb-ysck.cc)
target_link_libraries(yb-ysck
  ysck
)

add_library(yb-generate_partitions bulk_load_utils.cc yb-generate_partitions.cc)
target_link_libraries(yb-generate_partitions
  yb_client
  yb_util
  master_proto
)

add_executable(yb-generate_partitions_main yb-generate_partitions_main.cc)
target_link_libraries(yb-generate_partitions_main
  yb-generate_partitions
)

add_library(bulk_load_docdb_util bulk_load_docdb_util.cc)
target_link_libraries(bulk_load_docdb_util
  yb_docdb
)

add_executable(yb-bulk_load yb-bulk_load.cc)
target_link_libraries(yb-bulk_load
  gutil
  rocksdb
  yb_client
  bulk_load_docdb_util
  yb-generate_partitions
)

add_executable(yb-pbc-dump pbc-dump.cc)
target_link_libraries(yb-pbc-dump
  ${LINK_LIBS}
  encryption
)

add_library(admin-test-base admin-test-base.cc)
target_link_libraries(admin-test-base cql_test_util integration-tests yb_test_util yb_util)

add_library(tools_test_utils tools_test_utils.cc)
target_link_libraries(tools_test_utils yb_util yb_test_util)

add_library(test_admin_client test_admin_client.cc)
target_link_libraries(test_admin_client master_proto integration-tests)

add_library(yb-admin-test-base yb-admin-test-base.cc)
target_link_libraries(yb-admin-test-base integration-tests ql-dml-test-base)

set(YB_TEST_LINK_LIBS
  admin-test-base
  ysck
  yb-admin_lib
  yb_client
  yb_tools_util
  yb-generate_partitions
  integration-tests
  yb_docdb_test_common
  ql_util
  ql-dml-test-base
  test_admin_client
  tools_test_utils
  yb-backup-test_base
  pg_wrapper_test_base
  yb-admin-test-base
  ${YB_MIN_TEST_LIBS})
ADD_YB_TEST(ysck-test)
ADD_YB_TEST(yb-bulk_load-test)
ADD_YB_TEST_DEPENDENCIES(yb-bulk_load-test
  yb-generate_partitions_main
  yb-bulk_load)
ADD_YB_TEST(ysck_remote-test)
ADD_YB_TEST(yb-admin-snapshot-schedule-test)
ADD_YB_TEST_DEPENDENCIES(yb-admin-snapshot-schedule-test
  yb-admin)
ADD_YB_TEST(yb-admin-test)
ADD_YB_TEST_DEPENDENCIES(yb-admin-test
  yb-admin)
YB_TEST_TARGET_LINK_LIBRARIES(yb-admin-test cql_test_util)
ADD_YB_TEST(yb-admin-multi-master-test)
ADD_YB_TEST_DEPENDENCIES(yb-admin-multi-master-test
  yb-admin)
ADD_YB_TEST(yb-ts-cli-test)
ADD_YB_TEST_DEPENDENCIES(yb-ts-cli-test
  yb-ts-cli)
ADD_YB_TEST(ldb_test)
ADD_YB_TEST(rocksdb_dump_test)
ADD_YB_TEST(data-patcher-test)
ADD_YB_TEST_DEPENDENCIES(data-patcher-test data-patcher)
ADD_YB_TEST(yb-backup/yb-backup-test)
ADD_YB_TEST(yb-backup/yb-backup-cross-feature-test)
ADD_YB_TEST(yb-backup/yb-backup-during-ddl-test)
ADD_YB_TEST(yb-admin-snapshot-test)
ADD_YB_TEST(yb-admin-xcluster-test)
ADD_YB_TEST(yb-admin_client-test)
ADD_YB_TEST(yb-admin-are-nodes-safe-test)

add_executable(run-with-timeout run-with-timeout.cc)
target_link_libraries(run-with-timeout yb_util)

add_executable(sys-catalog-tool sys-catalog-tool.cc)
target_link_libraries(sys-catalog-tool boost_program_options master)

set(YB_BACKUP_TEST_BASE_SRCS
    yb-backup/yb-backup-test_base.cc)
set(YB_BACKUP_TEST_BASE_DEPS
    pg_wrapper_test_base
    admin-test-base)
ADD_YB_TEST_LIBRARY(yb-backup-test_base
                    SRCS ${YB_BACKUP_TEST_BASE_SRCS}
                    DEPS ${YB_BACKUP_TEST_BASE_DEPS})

add_executable(hnsw_tool hnsw_tool.cc)
target_link_libraries(hnsw_tool boost_program_options yb_util yb_docdb vector_index)

add_executable(clockbound_dump clockbound_dump.cc)
target_link_libraries(clockbound_dump
  clockbound yb_common yb_util)
