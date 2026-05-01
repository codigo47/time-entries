<?php

use App\Actions\CreateTimeEntries;
use App\Exceptions\TimeEntryValidationException;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;

beforeEach(function () {
    $this->company = Company::factory()->create();
    $this->employee = Employee::factory()->create();
    $this->employee->companies()->attach($this->company);
    $this->project = Project::factory()->for($this->company)->create();
    $this->employee->projects()->attach($this->project);
    $this->task = Task::factory()->for($this->company)->create();
});

it('creates a single valid time entry', function () {
    $action = app(CreateTimeEntries::class);
    $entries = $action->execute([
        [
            'company_id' => $this->company->id,
            'employee_id' => $this->employee->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'date' => '2026-05-01',
            'hours' => 2.5,
            'notes' => null,
        ],
    ]);
    expect($entries)->toHaveCount(1)
        ->and($entries[0])->toBeInstanceOf(TimeEntry::class);
    expect(TimeEntry::count())->toBe(1);
});

it('rejects when employee not in company', function () {
    $otherCompany = Company::factory()->create();
    $action = app(CreateTimeEntries::class);
    $this->expectException(TimeEntryValidationException::class);
    $action->execute([
        [
            'company_id' => $otherCompany->id,
            'employee_id' => $this->employee->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'date' => '2026-05-01',
            'hours' => 1.0,
            'notes' => null,
        ],
    ]);
});

it('rejects when project belongs to a different company', function () {
    $otherCompany = Company::factory()->create();
    $foreignProject = Project::factory()->for($otherCompany)->create();
    $action = app(CreateTimeEntries::class);
    try {
        $action->execute([[
            'company_id' => $this->company->id,
            'employee_id' => $this->employee->id,
            'project_id' => $foreignProject->id,
            'task_id' => $this->task->id,
            'date' => '2026-05-01',
            'hours' => 1.0,
            'notes' => null,
        ]]);
        $this->fail('expected exception');
    } catch (TimeEntryValidationException $e) {
        expect($e->errors)->toHaveKey('entries.0.project_id');
    }
});

it('rejects two different projects for same employee on same date in DB', function () {
    $otherProject = Project::factory()->for($this->company)->create();
    $this->employee->projects()->attach($otherProject);
    TimeEntry::create([
        'company_id' => $this->company->id,
        'employee_id' => $this->employee->id,
        'project_id' => $this->project->id,
        'task_id' => $this->task->id,
        'date' => '2026-05-01',
        'hours' => 1.0,
    ]);

    $action = app(CreateTimeEntries::class);
    try {
        $action->execute([[
            'company_id' => $this->company->id,
            'employee_id' => $this->employee->id,
            'project_id' => $otherProject->id,
            'task_id' => $this->task->id,
            'date' => '2026-05-01',
            'hours' => 1.0,
            'notes' => null,
        ]]);
        $this->fail('expected exception');
    } catch (TimeEntryValidationException $e) {
        expect($e->errors)->toHaveKey('entries.0.project_id');
    }
});

it('rejects two different projects within the same batch', function () {
    $other = Project::factory()->for($this->company)->create();
    $this->employee->projects()->attach($other);
    $action = app(CreateTimeEntries::class);
    try {
        $action->execute([
            [
                'company_id' => $this->company->id,
                'employee_id' => $this->employee->id,
                'project_id' => $this->project->id,
                'task_id' => $this->task->id,
                'date' => '2026-05-01',
                'hours' => 1.0,
                'notes' => null,
            ],
            [
                'company_id' => $this->company->id,
                'employee_id' => $this->employee->id,
                'project_id' => $other->id,
                'task_id' => $this->task->id,
                'date' => '2026-05-01',
                'hours' => 1.0,
                'notes' => null,
            ],
        ]);
        $this->fail('expected exception');
    } catch (TimeEntryValidationException $e) {
        expect($e->errors)->toHaveKey('entries.1.project_id');
    }
});

it('rejects an exact duplicate entry (same company, employee, project, task, date)', function () {
    // First create a valid entry
    $action = app(CreateTimeEntries::class);
    $action->execute([[
        'company_id' => $this->company->id,
        'employee_id' => $this->employee->id,
        'project_id' => $this->project->id,
        'task_id' => $this->task->id,
        'date' => '2026-05-01',
        'hours' => 2.0,
        'notes' => null,
    ]]);

    // Now try to create the same entry again
    try {
        $action->execute([[
            'company_id' => $this->company->id,
            'employee_id' => $this->employee->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'date' => '2026-05-01',
            'hours' => 3.0,
            'notes' => null,
        ]]);
        $this->fail('expected exception');
    } catch (TimeEntryValidationException $e) {
        expect($e->errors)->toHaveKey('entries.0.date');
        expect($e->errors['entries.0.date'][0])->toContain('already exists');
    }
});

it('allows multiple tasks for same project, employee, date', function () {
    $task2 = Task::factory()->for($this->company)->create();
    $action = app(CreateTimeEntries::class);
    $entries = $action->execute([
        [
            'company_id' => $this->company->id,
            'employee_id' => $this->employee->id,
            'project_id' => $this->project->id,
            'task_id' => $this->task->id,
            'date' => '2026-05-01',
            'hours' => 2.0,
            'notes' => null,
        ],
        [
            'company_id' => $this->company->id,
            'employee_id' => $this->employee->id,
            'project_id' => $this->project->id,
            'task_id' => $task2->id,
            'date' => '2026-05-01',
            'hours' => 2.0,
            'notes' => null,
        ],
    ]);
    expect($entries)->toHaveCount(2);
});
