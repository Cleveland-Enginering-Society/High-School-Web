'use client';

import { HOST_OPTION_LABELS } from '@/lib/hostOptions';
import {
  AccountTab,
  ADMIN_SORT_OPTIONS,
  AdminSortKey,
  COMPANY_SORT_OPTIONS,
  CompanySortKey,
  STUDENT_SORT_OPTIONS,
  StudentSortKey,
} from '@/lib/adminAccounts';

interface AdminAccountListControlsProps {
  activeTab: AccountTab;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortAscending: boolean;
  onSortAscendingChange: (value: boolean) => void;
  studentSort: StudentSortKey;
  onStudentSortChange: (value: StudentSortKey) => void;
  companySort: CompanySortKey;
  onCompanySortChange: (value: CompanySortKey) => void;
  adminSort: AdminSortKey;
  onAdminSortChange: (value: AdminSortKey) => void;
  filteredCount: number;
  totalCount: number;
  listedEmailCount: number;
  listedPhoneCount: number;
  onCopyEmails: () => void;
  onCopyPhones: () => void;
  copyNotice: string | null;
  hostOptionFilters: string[];
  onHostOptionFilterToggle: (option: string) => void;
  onClearHostOptionFilters: () => void;
}

export default function AdminAccountListControls({
  activeTab,
  searchQuery,
  onSearchChange,
  sortAscending,
  onSortAscendingChange,
  studentSort,
  onStudentSortChange,
  companySort,
  onCompanySortChange,
  adminSort,
  onAdminSortChange,
  filteredCount,
  totalCount,
  listedEmailCount,
  listedPhoneCount,
  onCopyEmails,
  onCopyPhones,
  copyNotice,
  hostOptionFilters,
  onHostOptionFilterToggle,
  onClearHostOptionFilters,
}: AdminAccountListControlsProps) {
  const sortOptions =
    activeTab === 'companies'
      ? COMPANY_SORT_OPTIONS
      : activeTab === 'admins'
        ? ADMIN_SORT_OPTIONS
        : STUDENT_SORT_OPTIONS;

  const sortValue =
    activeTab === 'companies'
      ? companySort
      : activeTab === 'admins'
        ? adminSort
        : studentSort;

  const onSortChange = (value: string) => {
    if (activeTab === 'companies') {
      onCompanySortChange(value as CompanySortKey);
    } else if (activeTab === 'admins') {
      onAdminSortChange(value as AdminSortKey);
    } else {
      onStudentSortChange(value as StudentSortKey);
    }
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <label className="flex-1 block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Search</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Name, email, school, company..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="block sm:w-48">
          <span className="block text-sm font-medium text-gray-700 mb-1">Sort by</span>
          <select
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:w-40">
          <span className="block text-sm font-medium text-gray-700 mb-1">Order</span>
          <select
            value={sortAscending ? 'asc' : 'desc'}
            onChange={(e) => onSortAscendingChange(e.target.value === 'asc')}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
      </div>

      {activeTab === 'companies' && (
        <div
          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
          role="group"
          aria-labelledby="host-options-filter-heading"
        >
          <p
            id="host-options-filter-heading"
            className="text-sm font-medium text-gray-900 mb-1"
          >
            Host options (select all that apply)
          </p>
          <p className="text-xs text-gray-600 mb-3">
            Show companies that offer at least one of the selected options. Leave all unchecked to
            show every company.
          </p>
          <div className="space-y-2">
            {HOST_OPTION_LABELS.map((option) => (
              <label
                key={option}
                className="flex items-start gap-2 cursor-pointer text-sm text-gray-800"
              >
                <input
                  type="checkbox"
                  checked={hostOptionFilters.includes(option)}
                  onChange={() => onHostOptionFilterToggle(option)}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 shrink-0"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          {hostOptionFilters.length > 0 && (
            <button
              type="button"
              onClick={onClearHostOptionFilters}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Clear host option filters
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-600">
          Showing {filteredCount} of {totalCount}{' '}
          {activeTab === 'companies' ? 'companies' : activeTab === 'admins' ? 'admins' : 'students'}
          {searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : ''}
          {activeTab === 'companies' && hostOptionFilters.length > 0
            ? ` · Host options: ${hostOptionFilters.join(', ')}`
            : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCopyEmails}
            disabled={listedEmailCount === 0}
            className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Copy emails ({listedEmailCount})
          </button>
          <button
            type="button"
            onClick={onCopyPhones}
            disabled={listedPhoneCount === 0}
            className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Copy phones ({listedPhoneCount})
          </button>
        </div>
      </div>
      {copyNotice && (
        <p className="text-sm text-green-700" role="status">
          {copyNotice}
        </p>
      )}
    </div>
  );
}
