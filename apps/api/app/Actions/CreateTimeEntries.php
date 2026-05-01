<?php

namespace App\Actions;

use App\Exceptions\TimeEntryValidationException;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;
use Illuminate\Support\Facades\DB;

class CreateTimeEntries
{
    /**
     * @param  array<int, array<string,mixed>>  $payload
     * @return array<int, TimeEntry>
     */
    public function execute(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $errors = $this->validateBatch($payload);
            if (count($errors) > 0) {
                throw new TimeEntryValidationException($errors);
            }

            return array_map(fn (array $row) => TimeEntry::create($row), $payload);
        });
    }

    /**
     * @param  array<int, array<string,mixed>>  $rows
     * @return array<string, array<string>>
     */
    private function validateBatch(array $rows): array
    {
        $errors = [];

        // Cross-row check: same (employee, date) must have same project
        $byEmpDate = [];
        foreach ($rows as $i => $row) {
            $key = $row['employee_id'].'|'.$row['date'];
            if (isset($byEmpDate[$key]) && $byEmpDate[$key]['project_id'] !== $row['project_id']) {
                $errors["entries.$i.project_id"][] = 'Conflicts with another row in this batch for the same employee and date.';
            } else {
                $byEmpDate[$key] = $row;
            }
        }

        // Per-row checks against persisted state and entity consistency
        foreach ($rows as $i => $row) {
            /** @var Employee|null $employee */
            $employee = Employee::with('companies', 'projects')->find($row['employee_id']);
            /** @var Project|null $project */
            $project = Project::find($row['project_id']);
            /** @var Task|null $task */
            $task = Task::find($row['task_id']);

            if (! $employee instanceof Employee || ! $employee->companies->contains('id', $row['company_id'])) {
                $errors["entries.$i.employee_id"][] = 'Employee does not belong to the selected company.';
            }
            if (! $project instanceof Project || $project->company_id !== $row['company_id']) {
                $errors["entries.$i.project_id"][] = 'Project does not belong to the selected company.';
            }
            if (! $task instanceof Task || $task->company_id !== $row['company_id']) {
                $errors["entries.$i.task_id"][] = 'Task does not belong to the selected company.';
            }
            if ($employee instanceof Employee && $project instanceof Project && ! $employee->projects->contains('id', $row['project_id'])) {
                $errors["entries.$i.project_id"][] = 'Employee is not assigned to this project.';
            }

            // Lock and check for "one project per employee per date"
            $existing = TimeEntry::where('employee_id', $row['employee_id'])
                ->where('date', $row['date'])
                ->lockForUpdate()
                ->first();
            if ($existing && $existing->project_id !== $row['project_id']) {
                $errors["entries.$i.project_id"][] = 'Employee already has a different project on this date.';
            }
        }

        return $errors;
    }
}
