import {
  AdminTourRequest,
  CompanyInfo,
  formatTourRequestDateTime,
  getCompanyFromTourRequest,
} from '@/lib/adminTourRequest';

function BulletedList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="font-medium text-sm text-gray-800">{label}</p>
      <ul className="list-disc list-inside ml-1 text-sm text-gray-700 space-y-0.5">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function TourRequestCompanyReference({
  company,
}: {
  company: CompanyInfo;
}) {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2 text-sm text-gray-700">
      <p className="font-semibold text-gray-900">Tour Request — Company Information</p>
      <p>
        <span className="font-medium">Company:</span> {company.company_name}
      </p>
      <p>
        <span className="font-medium">Industry:</span> {company.industry || '—'}
      </p>
      <p>
        <span className="font-medium">Location:</span> {company.company_location || '—'}
      </p>
      <p>
        <span className="font-medium">Main contact:</span>{' '}
        {company.contact_first_name} {company.contact_last_name} · {company.contact_email}
        {company.contact_phone ? ` · ${company.contact_phone}` : ''}
      </p>
      {(company.secondary_first_name || company.secondary_email) && (
        <p>
          <span className="font-medium">Secondary contact:</span>{' '}
          {[company.secondary_first_name, company.secondary_last_name]
            .filter(Boolean)
            .join(' ')}
          {company.secondary_email ? ` · ${company.secondary_email}` : ''}
          {company.secondary_phone ? ` · ${company.secondary_phone}` : ''}
        </p>
      )}
    </div>
  );
}

export function TourRequestScheduleReference({
  request,
}: {
  request: AdminTourRequest;
}) {
  const hasScheduleInfo =
    request.possible_days.length > 0 ||
    request.possible_times.length > 0 ||
    (request.date_options?.length ?? 0) > 0;

  if (!hasScheduleInfo) return null;

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3 text-sm">
      <p className="font-semibold text-gray-900">
        Tour Request — Scheduling Reference
      </p>
      <BulletedList label="Possible days:" items={request.possible_days} />
      <BulletedList label="Time frames:" items={request.possible_times} />
      {request.date_options && request.date_options.length > 0 && (
        <BulletedList
          label="Specific dates & times:"
          items={request.date_options.map(formatTourRequestDateTime)}
        />
      )}
    </div>
  );
}

export function TourRequestRequirementsReference({
  request,
}: {
  request: AdminTourRequest;
}) {
  const hasRequirements =
    request.food_drinks ||
    request.age_restrictions ||
    request.additional_requirements;

  if (!hasRequirements) return null;

  return (
    <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg space-y-2 text-sm text-gray-700">
      <p className="font-semibold text-gray-900">
        Tour Request — Requirements Reference
      </p>
      <p>
        <span className="font-medium">Age restrictions:</span>{' '}
        {request.age_restrictions}
      </p>
      {request.food_drinks && (
        <p>
          <span className="font-medium">Food & beverages:</span> {request.food_drinks}
        </p>
      )}
      {request.additional_requirements && (
        <p>
          <span className="font-medium">Additional requirements:</span>{' '}
          {request.additional_requirements}
        </p>
      )}
    </div>
  );
}

export function getTourRequestCompany(
  request: AdminTourRequest
): CompanyInfo | null {
  return getCompanyFromTourRequest(request);
}
