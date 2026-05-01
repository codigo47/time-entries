<?php

namespace App\Http\Requests\Concerns;

trait TimeEntryRules
{
    /** @return array<string, array<int, string>> */
    protected function rowRules(string $prefix = ''): array
    {
        return [
            "{$prefix}company_id" => ['required', 'uuid', 'exists:companies,id'],
            "{$prefix}employee_id" => ['required', 'uuid', 'exists:employees,id'],
            "{$prefix}project_id" => ['required', 'uuid', 'exists:projects,id'],
            "{$prefix}task_id" => ['required', 'uuid', 'exists:tasks,id'],
            "{$prefix}date" => ['required', 'date_format:Y-m-d', 'after_or_equal:2000-01-01', 'before_or_equal:'.now()->addDays(7)->toDateString()],
            "{$prefix}hours" => ['required', 'numeric', 'min:0.25', 'max:24', 'multiple_of:0.25'],
            "{$prefix}notes" => ['nullable', 'string', 'max:1000'],
        ];
    }
}
