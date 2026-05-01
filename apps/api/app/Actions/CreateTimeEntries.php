<?php

namespace App\Actions;

use App\Exceptions\TimeEntryValidationException;
use App\Models\Company;
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
                $conflictIdx = $byEmpDate[$key]['idx'];
                $rowNum = $i + 1;
                $conflictRowNum = $conflictIdx + 1;

                // Try to resolve names for descriptive message
                /** @var Employee|null $empForMsg */
                $empForMsg = Employee::find($row['employee_id']);
                /** @var Project|null $projA */
                $projA = Project::find($byEmpDate[$key]['project_id']);
                /** @var Project|null $projB */
                $projB = Project::find($row['project_id']);

                $employeeName = $empForMsg instanceof Employee ? $empForMsg->name : $row['employee_id'];
                $projectAName = $projA instanceof Project ? $projA->name : $byEmpDate[$key]['project_id'];
                $projectBName = $projB instanceof Project ? $projB->name : $row['project_id'];

                $errors["entries.$i.project_id"][] = "Conflict with row {$conflictRowNum}: {$employeeName} can only work on one project per day, "
                    ."but rows {$conflictRowNum} and {$rowNum} specify different projects ('{$projectAName}' vs '{$projectBName}') on {$row['date']}.";
            } else {
                $byEmpDate[$key] = array_merge($row, ['idx' => $i]);
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
            /** @var Company|null $company */
            $company = Company::find($row['company_id']);

            $companyName = $company instanceof Company ? $company->name : $row['company_id'];
            $employeeName = $employee instanceof Employee ? $employee->name : $row['employee_id'];
            $projectName = $project instanceof Project ? $project->name : $row['project_id'];

            if (! $employee instanceof Employee || ! $employee->companies->contains('id', $row['company_id'])) {
                $errors["entries.$i.employee_id"][] = "'{$employeeName}' is not an employee of '{$companyName}'.";
            }
            if (! $project instanceof Project || $project->company_id !== $row['company_id']) {
                if ($project instanceof Project) {
                    /** @var Company|null $projectCompany */
                    $projectCompany = Company::find($project->company_id);
                    $projectCompanyName = $projectCompany instanceof Company ? $projectCompany->name : $project->company_id;
                    $errors["entries.$i.project_id"][] = "Project '{$projectName}' belongs to '{$projectCompanyName}' but the entry is for '{$companyName}'.";
                } else {
                    $errors["entries.$i.project_id"][] = "Project '{$projectName}' does not belong to '{$companyName}'.";
                }
            }
            if (! $task instanceof Task || $task->company_id !== $row['company_id']) {
                $taskName = $task instanceof Task ? $task->name : $row['task_id'];
                $errors["entries.$i.task_id"][] = "Task '{$taskName}' does not belong to '{$companyName}'.";
            }
            if ($employee instanceof Employee && $project instanceof Project && ! $employee->projects->contains('id', $row['project_id'])) {
                $errors["entries.$i.project_id"][] = "'{$employeeName}' is not assigned to project '{$projectName}'.";
            }

            // Lock and check for "one project per employee per date"
            $existingEntries = TimeEntry::where('employee_id', $row['employee_id'])
                ->where('date', $row['date'])
                ->lockForUpdate()
                ->get();

            foreach ($existingEntries as $existing) {
                // Exact duplicate: same company, employee, project, task, date
                if (
                    $existing->company_id === $row['company_id'] &&
                    $existing->project_id === $row['project_id'] &&
                    $existing->task_id === $row['task_id']
                ) {
                    $taskName = $task instanceof Task ? $task->name : $row['task_id'];
                    $formattedDate = date('m/d/Y', strtotime($row['date']));
                    $errors["entries.$i.date"][] = "An entry already exists for {$employeeName} working on '{$taskName}' for project '{$projectName}' on {$formattedDate}. To change the hours or notes, edit the existing entry.";
                    break;
                }

                // Different project: one project per day rule
                if ($existing->project_id !== $row['project_id']) {
                    /** @var Project|null $existingProject */
                    $existingProject = Project::find($existing->project_id);
                    $existingProjectName = $existingProject instanceof Project ? $existingProject->name : $existing->project_id;
                    $errors["entries.$i.project_id"][] = "{$employeeName} already has time entries for project '{$existingProjectName}' on {$row['date']}. "
                        .'An employee can only work on one project per day (but multiple tasks within that project).';
                    break;
                }
            }
        }

        return $errors;
    }
}
