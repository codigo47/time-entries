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

    /** @return array<string, string> */
    protected function rowMessages(string $prefix = ''): array
    {
        return [
            "{$prefix}company_id.required" => 'Select a company for this entry.',
            "{$prefix}company_id.uuid" => 'The selected company is invalid.',
            "{$prefix}company_id.exists" => 'The selected company no longer exists.',
            "{$prefix}employee_id.required" => 'Select an employee.',
            "{$prefix}employee_id.uuid" => 'The selected employee is invalid.',
            "{$prefix}employee_id.exists" => 'The selected employee no longer exists.',
            "{$prefix}project_id.required" => 'Select a project.',
            "{$prefix}project_id.uuid" => 'The selected project is invalid.',
            "{$prefix}project_id.exists" => 'The selected project no longer exists.',
            "{$prefix}task_id.required" => 'Select a task.',
            "{$prefix}task_id.uuid" => 'The selected task is invalid.',
            "{$prefix}task_id.exists" => 'The selected task no longer exists.',
            "{$prefix}date.required" => 'Pick a date for this entry.',
            "{$prefix}date.date_format" => 'Date must be in YYYY-MM-DD format.',
            "{$prefix}date.after_or_equal" => 'Date is too far in the past.',
            "{$prefix}date.before_or_equal" => 'Date cannot be more than 7 days in the future.',
            "{$prefix}hours.required" => 'Enter the number of hours worked.',
            "{$prefix}hours.numeric" => 'Hours must be a number.',
            "{$prefix}hours.min" => 'Hours must be at least 0.25 (15 minutes).',
            "{$prefix}hours.max" => 'Hours cannot exceed 24 in a single entry.',
            "{$prefix}hours.multiple_of" => 'Hours must be in 15-minute increments (0.25, 0.50, 0.75, 1.00, ...).',
        ];
    }
}
