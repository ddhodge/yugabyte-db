//  Copyright (c) 2011-present, Facebook, Inc.  All rights reserved.
//  This source code is licensed under the BSD-style license found in the
//  LICENSE file in the root directory of this source tree. An additional grant
//  of patent rights can be found in the PATENTS file in the same directory.
//
// The following only applies to changes made to this file as part of YugaByte development.
//
// Portions Copyright (c) YugaByte, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.  You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied.  See the License for the specific language governing permissions and limitations
// under the License.
//
#include "yb/rocksdb/db/memtable_list.h"

#ifndef __STDC_FORMAT_MACROS
#define __STDC_FORMAT_MACROS
#endif

#include <inttypes.h>

#include <string>

#include "yb/gutil/casts.h"

#include "yb/rocksdb/db.h"
#include "yb/rocksdb/db/memtable.h"
#include "yb/rocksdb/db/version_set.h"
#include "yb/rocksdb/env.h"
#include "yb/rocksdb/iterator.h"
#include "yb/rocksdb/table/merger.h"
#include "yb/rocksdb/util/coding.h"
#include "yb/rocksdb/util/log_buffer.h"

#include "yb/util/result.h"

using yb::Result;
using std::ostringstream;

namespace rocksdb {

class InternalKeyComparator;
class Mutex;
class VersionSet;

void MemTableListVersion::VerifyNumFlushginBytes() const {
#ifndef NDEBUG
  size_t total_data_size = 0;
  for (const auto* mem_table : memlist_) {
    total_data_size += mem_table->data_size();
  }
  DCHECK_EQ(total_data_size, total_data_size_);
#endif
}

void MemTableListVersion::AddMemTable(MemTable* m) {
  memlist_.push_front(m);
  total_data_size_ += m->data_size();
  VerifyNumFlushginBytes();
  *parent_memtable_list_memory_usage_ += m->ApproximateMemoryUsage();
}

void MemTableListVersion::UnrefMemTable(autovector<MemTable*>* to_delete,
                                        MemTable* m) {
  if (m->Unref()) {
    to_delete->push_back(m);
    assert(*parent_memtable_list_memory_usage_ >= m->ApproximateMemoryUsage());
    *parent_memtable_list_memory_usage_ -= m->ApproximateMemoryUsage();
  } else {
  }
}

MemTableListVersion::MemTableListVersion(
    size_t* parent_memtable_list_memory_usage, MemTableListVersion* old)
    : max_write_buffer_number_to_maintain_(
          old->max_write_buffer_number_to_maintain_),
      parent_memtable_list_memory_usage_(parent_memtable_list_memory_usage) {
  if (old != nullptr) {
    total_data_size_ = old->total_data_size_;
    memlist_ = old->memlist_;
    for (auto& m : memlist_) {
      m->Ref();
    }
    VerifyNumFlushginBytes();

    memlist_history_ = old->memlist_history_;
    for (auto& m : memlist_history_) {
      m->Ref();
    }
  }
}

MemTableListVersion::MemTableListVersion(
    size_t* parent_memtable_list_memory_usage,
    int max_write_buffer_number_to_maintain)
    : max_write_buffer_number_to_maintain_(max_write_buffer_number_to_maintain),
      parent_memtable_list_memory_usage_(parent_memtable_list_memory_usage) {}

void MemTableListVersion::Ref() { ++refs_; }

// called by superversion::clean()
void MemTableListVersion::Unref(autovector<MemTable*>* to_delete) {
  assert(refs_ >= 1);
  --refs_;
  if (refs_ == 0) {
    // if to_delete is equal to nullptr it means we're confident
    // that refs_ will not be zero
    assert(to_delete != nullptr);
    for (const auto& m : memlist_) {
      UnrefMemTable(to_delete, m);
    }
    for (const auto& m : memlist_history_) {
      UnrefMemTable(to_delete, m);
    }
    delete this;
  }
}

size_t MemTableList::TotalDataSize() const {
  return current_->total_data_size_;
}

int MemTableList::NumNotFlushed() const {
  int size = static_cast<int>(current_->memlist_.size());
  assert(num_flush_not_started_ <= size);
  return size;
}

// Usually immutable mem table list is empty, and frontier could be taken from active mem table.
// So we implement logic to avoid doing clone when there is just one frontier source.
UserFrontierPtr MemTableList::GetFrontier(UserFrontierPtr frontier, UpdateUserValueType type) {
  for (const auto& mem : current_->memlist_) {
    auto current = mem->GetFrontier(type);
    if (!current) {
      continue;
    }
    if (!frontier) {
      frontier = current;
      continue;
    }
    frontier->Update(*current, type);
  }
  return frontier;
}

int MemTableList::NumFlushed() const {
  return static_cast<int>(current_->memlist_history_.size());
}

// Search all the memtables starting from the most recent one.
// Return the most recent value found, if any.
// Operands stores the list of merge operations to apply, so far.
bool MemTableListVersion::Get(const LookupKey& key, std::string* value,
                              Status* s, MergeContext* merge_context,
                              SequenceNumber* seq) {
  return GetFromList(&memlist_, key, value, s, merge_context, seq);
}

bool MemTableListVersion::GetFromHistory(const LookupKey& key,
                                         std::string* value, Status* s,
                                         MergeContext* merge_context,
                                         SequenceNumber* seq) {
  return GetFromList(&memlist_history_, key, value, s, merge_context, seq);
}

bool MemTableListVersion::GetFromList(std::list<MemTable*>* list,
                                      const LookupKey& key, std::string* value,
                                      Status* s, MergeContext* merge_context,
                                      SequenceNumber* seq) {
  *seq = kMaxSequenceNumber;

  for (auto& memtable : *list) {
    SequenceNumber current_seq = kMaxSequenceNumber;

    bool done = memtable->Get(key, value, s, merge_context, &current_seq);
    if (*seq == kMaxSequenceNumber) {
      // Store the most recent sequence number of any operation on this key.
      // Since we only care about the most recent change, we only need to
      // return the first operation found when searching memtables in
      // reverse-chronological order.
      *seq = current_seq;
    }

    if (done) {
      assert(*seq != kMaxSequenceNumber);
      return true;
    }
  }
  return false;
}

void MemTableListVersion::AddIterators(
    const ReadOptions& options, std::vector<InternalIterator*>* iterator_list,
    Arena* arena) {
  for (auto& m : memlist_) {
    iterator_list->push_back(m->NewIterator(options, arena));
  }
}

void MemTableListVersion::AddIterators(
    const ReadOptions& options, MergeIteratorBuilder* merge_iter_builder) {
  for (auto& m : memlist_) {
    merge_iter_builder->AddIterator(
        m->NewIterator(options, merge_iter_builder->GetArena()));
  }
}

uint64_t MemTableListVersion::GetTotalNumEntries() const {
  uint64_t total_num = 0;
  for (auto& m : memlist_) {
    total_num += m->num_entries();
  }
  return total_num;
}

uint64_t MemTableListVersion::ApproximateSize(const Slice& start_ikey,
                                              const Slice& end_ikey) {
  uint64_t total_size = 0;
  for (auto& m : memlist_) {
    total_size += m->ApproximateSize(start_ikey, end_ikey);
  }
  return total_size;
}

uint64_t MemTableListVersion::GetTotalNumDeletes() const {
  uint64_t total_num = 0;
  for (auto& m : memlist_) {
    total_num += m->num_deletes();
  }
  return total_num;
}

SequenceNumber MemTableListVersion::GetEarliestSequenceNumber(
    bool include_history) const {
  if (include_history && !memlist_history_.empty()) {
    return memlist_history_.back()->GetEarliestSequenceNumber();
  } else if (!memlist_.empty()) {
    return memlist_.back()->GetEarliestSequenceNumber();
  } else {
    return kMaxSequenceNumber;
  }
}

// caller is responsible for referencing m
void MemTableListVersion::Add(MemTable* m, autovector<MemTable*>* to_delete) {
  assert(refs_ == 1);  // only when refs_ == 1 is MemTableListVersion mutable
  AddMemTable(m);

  TrimHistory(to_delete);
}

// Removes m from list of memtables not flushed.  Caller should NOT Unref m.
void MemTableListVersion::Remove(MemTable* m,
                                 autovector<MemTable*>* to_delete) {
  assert(refs_ == 1);  // only when refs_ == 1 is MemTableListVersion mutable
  memlist_.remove(m);
  total_data_size_ -= m->data_size();
  VerifyNumFlushginBytes();

  if (max_write_buffer_number_to_maintain_ > 0) {
    memlist_history_.push_front(m);
    TrimHistory(to_delete);
  } else {
    UnrefMemTable(to_delete, m);
  }
}

// Make sure we don't use up too much space in history
void MemTableListVersion::TrimHistory(autovector<MemTable*>* to_delete) {
  while (memlist_.size() + memlist_history_.size() >
             static_cast<size_t>(max_write_buffer_number_to_maintain_) &&
         !memlist_history_.empty()) {
    MemTable* x = memlist_history_.back();
    memlist_history_.pop_back();

    UnrefMemTable(to_delete, x);
  }
}

// Returns true if there is at least one memtable on which flush has
// not yet started.
bool MemTableList::IsFlushPending() const {
  if ((flush_requested_ && num_flush_not_started_ >= 1) ||
      (num_flush_not_started_ >= min_write_buffer_number_to_merge_)) {
    assert(imm_flush_needed.load(std::memory_order_relaxed));
    return true;
  }
  return false;
}

// Returns the memtables that need to be flushed.
void MemTableList::PickMemtablesToFlush(
    autovector<MemTable*>* ret, const MemTableFilter& filter,
    const MutableCFOptions* mutable_cf_options) {
  const auto& memlist = current_->memlist_;
  bool all_memtables_logged = false;
  bool write_blocked =
      mutable_cf_options &&
      yb::make_signed(current_->memlist_.size()) >= mutable_cf_options->max_write_buffer_number;
  for (auto it = memlist.rbegin(); it != memlist.rend(); ++it) {
    MemTable* m = *it;
    if (m->flush_in_progress_) {
      continue;
    }
    if (filter) {
      Result<bool> filter_result = filter(*m, write_blocked);
      if (filter_result.ok()) {
        if (!filter_result.get()) {
          // The filter succeeded and said that this memtable cannot be flushed yet.
          break;
        }
      } else {
        // This failure usually means that there is an empty immutable memtable. We need to output
        // additional diagnostics in that case.
        ostringstream ss;
        if (!all_memtables_logged) {
          ss << ". All memtables:\n";
          for (const MemTable* memtable_for_logging : memlist) {
            ss << "  " << memtable_for_logging->ToString() << "\n";
          }
          all_memtables_logged = true;
        }
        LOG(DFATAL) << "Failed when checking if memtable can be flushed (will still flush it): "
                    << filter_result.status() << ". Memtable: " << m->ToString()
                    << ss.str();
        // Still flush the memtable so that this error does not keep occurring.
      }
    }
    assert(!m->flush_completed_);
    num_flush_not_started_--;
    if (num_flush_not_started_ == 0) {
      imm_flush_needed.store(false, std::memory_order_release);
    }
    m->flush_in_progress_ = true;  // flushing will start very soon
    ret->push_back(m);
  }

  flush_requested_ = false;  // start-flush request is complete
}

void MemTableList::RollbackMemtableFlush(const autovector<MemTable*>& mems,
                                         uint64_t file_number) {
  assert(!mems.empty());

  // If the flush was not successful, then just reset state.
  // Maybe a succeeding attempt to flush will be successful.
  for (MemTable* m : mems) {
    assert(m->flush_in_progress_);
    assert(m->file_number_ == 0);

    m->flush_in_progress_ = false;
    m->flush_completed_ = false;
    m->edit_.Clear();
    num_flush_not_started_++;
  }
  imm_flush_needed.store(true, std::memory_order_release);
}

// Record a successful flush in the manifest file
Status MemTableList::InstallMemtableFlushResults(
    ColumnFamilyData* cfd, const MutableCFOptions& mutable_cf_options,
    const autovector<MemTable*>& mems, VersionSet* vset, InstrumentedMutex* mu,
    uint64_t file_number, autovector<MemTable*>* to_delete,
    Directory* db_directory, LogBuffer* log_buffer, const FileNumbersHolder& file_number_holder) {
  mu->AssertHeld();

  // flush was successful
  UserFrontiersPtr frontiers;
  for (size_t i = 0; i < mems.size(); ++i) {
    // All the edits are associated with the first memtable of this batch.
    DCHECK(i == 0 || mems[i]->GetEdits()->NumEntries() == 0);

    mems[i]->flush_completed_ = true;
    auto temp_range = mems[i]->Frontiers();
    if (temp_range) {
      UpdateFrontiers(frontiers, *temp_range);
    }
    mems[i]->file_number_holder_ = file_number_holder;
    mems[i]->file_number_ = file_number;
  }
  if (frontiers) {
    mems[0]->edit_.UpdateFlushedFrontier(frontiers->Largest().Clone());
  }

  // if some other thread is already committing, then return
  Status s;
  if (commit_in_progress_) {
    return s;
  }

  // Only a single thread can be executing this piece of code
  commit_in_progress_ = true;

  // Scan all memtables from the earliest, and commit those
  // (in that order) that have finished flushing. Memtables
  // are always committed in the order that they were created.
  while (!current_->memlist_.empty() && s.ok()) {
    MemTable* m = current_->memlist_.back();  // get the last element
    if (!m->flush_completed_) {
      break;
    }

    LOG_TO_BUFFER(log_buffer, "[%s] Level-0 commit table #%" PRIu64 " started",
                cfd->GetName().c_str(), m->file_number_);

    // this can release and reacquire the mutex.
    s = vset->LogAndApply(cfd, mutable_cf_options, &m->edit_, mu, db_directory);

    // we will be changing the version in the next code path,
    // so we better create a new one, since versions are immutable
    InstallNewVersion();

    // All the later memtables that have the same filenum
    // are part of the same batch. They can be committed now.
    uint64_t mem_id = 1;  // how many memtables have been flushed.
    do {
      if (s.ok()) { // commit new state
        LOG_TO_BUFFER(log_buffer, "[%s] Level-0 commit table #%" PRIu64
                                ": memtable #%" PRIu64 " done",
                    cfd->GetName().c_str(), m->file_number_, mem_id);
        assert(m->file_number_ > 0);
        current_->Remove(m, to_delete);
      } else {
        // commit failed. setup state so that we can flush again.
        LOG_TO_BUFFER(log_buffer, "Level-0 commit table #%" PRIu64
                                ": memtable #%" PRIu64 " failed",
                    m->file_number_, mem_id);
        m->flush_completed_ = false;
        m->flush_in_progress_ = false;
        m->edit_.Clear();
        num_flush_not_started_++;
        m->file_number_ = 0;
        m->file_number_holder_.Reset();
        imm_flush_needed.store(true, std::memory_order_release);
      }
      ++mem_id;
    } while (!current_->memlist_.empty() && (m = current_->memlist_.back()) &&
             m->file_number_ == file_number);
  }
  commit_in_progress_ = false;
  return s;
}

// New memtables are inserted at the front of the list.
void MemTableList::Add(MemTable* m, autovector<MemTable*>* to_delete) {
  assert(static_cast<int>(current_->memlist_.size()) >= num_flush_not_started_);
  InstallNewVersion();
  // this method is used to move mutable memtable into an immutable list.
  // since mutable memtable is already refcounted by the DBImpl,
  // and when moving to the imutable list we don't unref it,
  // we don't have to ref the memtable here. we just take over the
  // reference from the DBImpl.
  current_->Add(m, to_delete);
  m->MarkImmutable();
  num_flush_not_started_++;
  if (num_flush_not_started_ == 1) {
    imm_flush_needed.store(true, std::memory_order_release);
  }
}

// Returns an estimate of the number of bytes of data in use.
size_t MemTableList::ApproximateUnflushedMemTablesMemoryUsage() {
  size_t total_size = 0;
  for (auto& memtable : current_->memlist_) {
    total_size += memtable->ApproximateMemoryUsage();
  }
  return total_size;
}

size_t MemTableList::ApproximateMemoryUsage() { return current_memory_usage_; }

void MemTableList::InstallNewVersion() {
  if (current_->refs_ == 1) {
    // we're the only one using the version, just keep using it
  } else {
    // somebody else holds the current version, we need to create new one
    MemTableListVersion* version = current_;
    current_ = new MemTableListVersion(&current_memory_usage_, current_);
    current_->Ref();
    version->Unref();
  }
}

}  // namespace rocksdb
