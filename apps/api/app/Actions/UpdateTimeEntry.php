<?php

namespace App\Actions;

use App\Exceptions\TimeEntryValidationException;
use App\Models\Employee;
use App\Models\Project;
use App\Models\TimeEntry;
use Illuminate\Support\Facades\DB;

class UpdateTimeEntry
{
    /** @param  array<string,mixed>  $payload */
    public function execute(TimeEntry $entry, array $payload): TimeEntry
    {
        return DB::transaction(function () use ($entry, $payload) {
            $merged = array_merge($entry->only([
                'company_id', 'employee_id', 'project_id', 'task_id', 'date', 'hours', 'notes',
            ]), $payload);

            $errors = $this->validate($entry, $merged);
            if ($errors !== []) {
                throw new TimeEntryValidationException($errors);
            }

            $entry->update($payload);
            return $entry->refresh();
        });
    }

    /**
     * @param  array<string,mixed>  $merged
     * @return array<string, array<string>>
     */
    private function validate(TimeEntry $entry, array $merged): array
    {
        $errors = [];

        $existing = TimeEntry::where('employee_id', $merged['employee_id'])
            ->where('date', $merged['date'])
            ->where('id', '!=', $entry->id)
            ->lockForUpdate()
            ->get();

        foreach ($existing as $other) {
            if ($other->project_id !== $merged['project_id']) {
                /** @var Employee|null $emp */
                $emp = Employee::find($merged['employee_id']);
                $employeeName = $emp instanceof Employee ? $emp->name : $merged['employee_id'];

                /** @var Project|null $proj */
                $proj = Project::find($other->project_id);
                $existingProjectName = $proj instanceof Project ? $proj->name : $other->project_id;

                $errors['project_id'][] = "{$employeeName} already has time entries for project '{$existingProjectName}' on {$merged['date']}. "
                    .'An employee can only work on one project per day (but multiple tasks within that project).';
                break;
            }
        }

        return $errors;
    }
}
