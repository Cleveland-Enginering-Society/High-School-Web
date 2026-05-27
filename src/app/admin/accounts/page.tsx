'use client';

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isAdminProfile } from '@/lib/roles';
import AdminAccountListControls from '@/components/admin/AdminAccountListControls';
import {
  AccountTab,
  AdminAccountsPayload,
  AdminCompanyAccount,
  AdminSortKey,
  AdminStaffAccount,
  AdminStudentAccount,
  CompanySortKey,
  filterAdmins,
  filterCompanies,
  collectListedEmails,
  collectListedPhones,
  filterStudents,
  formatAccountName,
  formatContactsForClipboard,
  sortAdmins,
  sortCompanies,
  sortStudents,
  StudentSortKey,
} from '@/lib/adminAccounts';

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded border ${
        isActive
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-gray-100 text-gray-600 border-gray-300'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function RoleBadge({ label }: { label: string }) {
  const isElevated = label === 'Student admin';
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded border ${
        isElevated
          ? 'bg-purple-100 text-purple-800 border-purple-200'
          : 'bg-gray-100 text-gray-700 border-gray-300'
      }`}
    >
      {label}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <p className="text-sm text-gray-700">
      <span className="font-medium text-gray-900">{label}: </span>
      {value}
    </p>
  );
}

const cardLinkClass =
  'block border border-gray-300 rounded-lg p-4 md:p-5 bg-white shadow-sm hover:border-blue-400 hover:shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500';

function StudentCard({ account }: { account: AdminStudentAccount }) {
  return (
    <Link href={`/admin/accounts/${account.id}`} className={cardLinkClass}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <h2 className="text-lg font-semibold text-blue-700">
          {formatAccountName(account.firstName, account.lastName)}
        </h2>
        <div className="flex flex-wrap gap-2">
          <RoleBadge label={account.roleLabel} />
          <ActiveBadge isActive={account.isActive} />
        </div>
      </div>
      <div className="space-y-1">
        <DetailRow label="Email" value={account.email} />
        <DetailRow label="Grade" value={account.grade} />
        <DetailRow label="School" value={account.school} />
        <DetailRow label="Phone" value={account.phone} />
      </div>
      <p className="text-xs text-gray-500 mt-3">View full profile →</p>
    </Link>
  );
}

function CompanyCard({ account }: { account: AdminCompanyAccount }) {
  const contactName = formatAccountName(account.contactFirstName, account.contactLastName);
  return (
    <Link href={`/admin/accounts/${account.id}`} className={cardLinkClass}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <h2 className="text-lg font-semibold text-blue-700">{account.companyName || '—'}</h2>
        <ActiveBadge isActive={account.isActive} />
      </div>
      <div className="space-y-1">
        <DetailRow label="Industry" value={account.industry} />
        <DetailRow label="Location" value={account.location} />
        <DetailRow label="Primary contact" value={contactName !== '—' ? contactName : null} />
        <DetailRow label="Contact email" value={account.contactEmail} />
        <DetailRow label="Contact phone" value={account.contactPhone} />
      </div>
      <p className="text-xs text-gray-500 mt-3">View full profile →</p>
    </Link>
  );
}

function AdminCard({ account }: { account: AdminStaffAccount }) {
  return (
    <Link href={`/admin/accounts/${account.id}`} className={cardLinkClass}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <h2 className="text-lg font-semibold text-blue-700">
          {formatAccountName(account.firstName, account.lastName)}
        </h2>
        <ActiveBadge isActive={account.isActive} />
      </div>
      <div className="space-y-1">
        <DetailRow label="Email" value={account.email} />
        <DetailRow label="Phone" value={account.phone} />
      </div>
      <p className="text-xs text-gray-500 mt-3">View full profile →</p>
    </Link>
  );
}

function emptyTabMessage(tab: AccountTab, hasSearch: boolean): string {
  if (hasSearch) return 'No accounts match your search.';
  switch (tab) {
    case 'companies':
      return 'No company accounts found.';
    case 'admins':
      return 'No admin accounts found.';
    default:
      return 'No student accounts found.';
  }
}

function isAccountTab(value: string | null): value is AccountTab {
  return value === 'students' || value === 'companies' || value === 'admins';
}

export default function AdminAccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading accounts...</p>
        </div>
      }
    >
      <AdminAccountsPageContent />
    </Suspense>
  );
}

function AdminAccountsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [accounts, setAccounts] = useState<AdminAccountsPayload>({
    students: [],
    companies: [],
    admins: [],
  });
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<AccountTab>(
    isAccountTab(tabFromUrl) ? tabFromUrl : 'students'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAscending, setSortAscending] = useState(true);
  const [studentSort, setStudentSort] = useState<StudentSortKey>('name');
  const [companySort, setCompanySort] = useState<CompanySortKey>('company');
  const [adminSort, setAdminSort] = useState<AdminSortKey>('name');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [hostOptionFilters, setHostOptionFilters] = useState<string[]>([]);

  useEffect(() => {
    if (isAccountTab(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    setCopyNotice(null);
  }, [activeTab, searchQuery, hostOptionFilters]);

  useEffect(() => {
    if (activeTab !== 'companies') {
      setHostOptionFilters([]);
    }
  }, [activeTab]);

  const toggleHostOptionFilter = (option: string) => {
    setHostOptionFilters((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const loadAccounts = useCallback(async () => {
    const response = await fetch('/api/admin/accounts');
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to load accounts');
    }
    return response.json() as Promise<AdminAccountsPayload>;
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const accountResponse = await fetch('/api/account');
      if (!accountResponse.ok) {
        router.push('/login');
        return;
      }

      const accountData = await accountResponse.json();
      if (!isAdminProfile(accountData.user ?? {})) {
        router.push('/');
        return;
      }

      try {
        setError(null);
        const data = await loadAccounts();
        setAccounts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load accounts');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router, supabase.auth, loadAccounts]);

  const filteredStudents = useMemo(
    () => sortStudents(filterStudents(accounts.students, searchQuery), studentSort, sortAscending),
    [accounts.students, searchQuery, studentSort, sortAscending]
  );
  const filteredCompanies = useMemo(
    () =>
      sortCompanies(
        filterCompanies(accounts.companies, searchQuery, hostOptionFilters),
        companySort,
        sortAscending
      ),
    [accounts.companies, searchQuery, hostOptionFilters, companySort, sortAscending]
  );
  const filteredAdmins = useMemo(
    () => sortAdmins(filterAdmins(accounts.admins, searchQuery), adminSort, sortAscending),
    [accounts.admins, searchQuery, adminSort, sortAscending]
  );

  const studentCount = accounts.students.length;
  const companyCount = accounts.companies.length;
  const adminCount = accounts.admins.length;

  const listContent = useMemo(() => {
    const hasSearch = searchQuery.trim().length > 0;

    switch (activeTab) {
      case 'companies':
        if (filteredCompanies.length === 0) {
          return <p className="text-gray-600">{emptyTabMessage('companies', hasSearch)}</p>;
        }
        return (
          <div className="space-y-4">
            {filteredCompanies.map((account) => (
              <CompanyCard key={account.id} account={account} />
            ))}
          </div>
        );
      case 'admins':
        if (filteredAdmins.length === 0) {
          return <p className="text-gray-600">{emptyTabMessage('admins', hasSearch)}</p>;
        }
        return (
          <div className="space-y-4">
            {filteredAdmins.map((account) => (
              <AdminCard key={account.id} account={account} />
            ))}
          </div>
        );
      default:
        if (filteredStudents.length === 0) {
          return <p className="text-gray-600">{emptyTabMessage('students', hasSearch)}</p>;
        }
        return (
          <div className="space-y-4">
            {filteredStudents.map((account) => (
              <StudentCard key={account.id} account={account} />
            ))}
          </div>
        );
    }
  }, [activeTab, filteredStudents, filteredCompanies, filteredAdmins, searchQuery]);

  const listedLists = useMemo(
    () => ({
      students: filteredStudents,
      companies: filteredCompanies,
      admins: filteredAdmins,
    }),
    [filteredStudents, filteredCompanies, filteredAdmins]
  );

  const listedEmails = useMemo(
    () => collectListedEmails(activeTab, listedLists),
    [activeTab, listedLists]
  );
  const listedPhones = useMemo(
    () => collectListedPhones(activeTab, listedLists),
    [activeTab, listedLists]
  );

  const copyListedContacts = async (values: string[], label: string) => {
    setCopyNotice(null);
    if (values.length === 0) {
      setCopyNotice(`No ${label} in the current list.`);
      return;
    }
    try {
      await navigator.clipboard.writeText(formatContactsForClipboard(values));
      setCopyNotice(
        `Copied ${values.length} ${label === 'emails' ? 'email' : 'phone number'}${values.length === 1 ? '' : 's'}.`
      );
    } catch {
      setCopyNotice(`Could not copy ${label}. Check browser clipboard permissions.`);
    }
  };

  const filteredCount =
    activeTab === 'companies'
      ? filteredCompanies.length
      : activeTab === 'admins'
        ? filteredAdmins.length
        : filteredStudents.length;
  const totalCount =
    activeTab === 'companies'
      ? companyCount
      : activeTab === 'admins'
        ? adminCount
        : studentCount;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Accounts</h1>
          <p className="text-gray-600">
            Search and sort registered students, companies, and CES admin accounts. Click a
            profile to view all account data.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-1 border-b border-gray-300 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'students'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Students ({studentCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('companies')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'companies'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Companies ({companyCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'admins'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Admins ({adminCount})
          </button>
        </div>

        <AdminAccountListControls
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortAscending={sortAscending}
          onSortAscendingChange={setSortAscending}
          studentSort={studentSort}
          onStudentSortChange={setStudentSort}
          companySort={companySort}
          onCompanySortChange={setCompanySort}
          adminSort={adminSort}
          onAdminSortChange={setAdminSort}
          filteredCount={filteredCount}
          totalCount={totalCount}
          listedEmailCount={listedEmails.length}
          listedPhoneCount={listedPhones.length}
          onCopyEmails={() => copyListedContacts(listedEmails, 'emails')}
          onCopyPhones={() => copyListedContacts(listedPhones, 'phones')}
          copyNotice={copyNotice}
          hostOptionFilters={hostOptionFilters}
          onHostOptionFilterToggle={toggleHostOptionFilter}
          onClearHostOptionFilters={() => setHostOptionFilters([])}
        />

        {listContent}
      </div>
    </div>
  );
}
