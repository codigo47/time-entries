<?php

use App\Actions\UpdateTimeEntry;
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
    $this->entry = TimeEntry::create([
        'company_id' => $this->company->id,
        'employee_id' => $this->employee->id,
        'project_id' => $this->project->id,
        'task_id' => $this->task->id,
        'date' => '2026-05-01',
        'hours' => 1.0,
    ]);
});

it('updates editable fields', function () {
    $action = app(UpdateTimeEntry::class);
    $updated = $action->execute($this->entry, ['hours' => 3.5, 'notes' => 'Refactor']);
    expect((float) $updated->hours)->toBe(3.5);
    expect($updated->notes)->toBe('Refactor');
});

it('rejects an update that would create an exact duplicate (same company, employee, project, task, date)', function () {
    $task2 = Task::factory()->for($this->company)->create();
    $secondEntry = TimeEntry::create([
        'company_id' => $this->company->id,
        'employee_id' => $this->employee->id,
        'project_id' => $this->project->id,
        'task_id' => $task2->id,
        'date' => '2026-05-01',
        'hours' => 2.0,
    ]);

    $action = app(UpdateTimeEntry::class);
    try {
        // Try to change secondEntry's task to match the first entry exactly
        $action->execute($secondEntry, ['task_id' => $this->task->id]);
        $this->fail('expected exception');
    } catch (TimeEntryValidationException $e) {
        expect($e->errors)->toHaveKey('date');
        expect($e->errors['date'][0])->toContain('already exists');
    }
});

it('rejects an update that would conflict with the per-day-project rule', function () {
    $other = Project::factory()->for($this->company)->create();
    $this->employee->projects()->attach($other);
    TimeEntry::create([
        'company_id' => $this->company->id,
        'employee_id' => $this->employee->id,
        'project_id' => $this->project->id,
        'task_id' => $this->task->id,
        'date' => '2026-05-02',
        'hours' => 1.0,
    ]);
    $action = app(UpdateTimeEntry::class);
    try {
        $action->execute($this->entry, [
            'date' => '2026-05-02',
            'project_id' => $other->id,
        ]);
        $this->fail('expected exception');
    } catch (TimeEntryValidationException $e) {
        expect($e->errors)->toHaveKey('project_id');
    }
});
