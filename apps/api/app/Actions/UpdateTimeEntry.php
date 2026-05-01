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

        /** @var Employee|null $emp */
        $emp = Employee::find($merged['employee_id']);
        $employeeName = $emp instanceof Employee ? $emp->name : $merged['employee_id'];

        foreach ($existing as $other) {
            // Exact duplicate: same company, employee, project, task, date
            if (
                $other->company_id === $merged['company_id'] &&
                $other->project_id === $merged['project_id'] &&
                $other->task_id === $merged['task_id']
            ) {
                /** @var \App\Models\Project|null $proj */
                $proj = \App\Models\Project::find($merged['project_id']);
                $projectName = $proj instanceof \App\Models\Project ? $proj->name : $merged['project_id'];
                /** @var \App\Models\Task|null $taskModel */
                $taskModel = \App\Models\Task::find($merged['task_id']);
                $taskName = $taskModel instanceof \App\Models\Task ? $taskModel->name : $merged['task_id'];
                $formattedDate = date('m/d/Y', strtotime($merged['date']));
                $errors['date'][] = "An entry already exists for {$employeeName} working on '{$taskName}' for project '{$projectName}' on {$formattedDate}. To change the hours or notes, edit the existing entry.";
                break;
            }

            if ($other->project_id !== $merged['project_id']) {
                $errors['project_id'][] = 'An employee can only be assigned to one project per date.';
                break;
            }
        }

        return $errors;
    }
}
