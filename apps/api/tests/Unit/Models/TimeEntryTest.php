<?php

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;

it('belongs to company, employee, project, task', function () {
    $entry = TimeEntry::factory()->create();
    expect($entry->company)->toBeInstanceOf(Company::class);
    expect($entry->employee)->toBeInstanceOf(Employee::class);
    expect($entry->project)->toBeInstanceOf(Project::class);
    expect($entry->task)->toBeInstanceOf(Task::class);
});

it('casts date and hours', function () {
    $entry = TimeEntry::factory()->create(['date' => '2026-05-01', 'hours' => '2.50']);
    expect($entry->date)->toBeInstanceOf(\Illuminate\Support\Carbon::class);
    expect((float) $entry->hours)->toBe(2.5);
});

it('rejects exact-duplicate row at db level', function () {
    $entry = TimeEntry::factory()->create();
    expect(fn () => TimeEntry::factory()->create([
        'employee_id' => $entry->employee_id,
        'date' => $entry->date,
        'project_id' => $entry->project_id,
        'task_id' => $entry->task_id,
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});

it('rejects hours outside range at db level', function () {
    expect(fn () => TimeEntry::factory()->create(['hours' => 0]))
        ->toThrow(\Illuminate\Database\QueryException::class);
    expect(fn () => TimeEntry::factory()->create(['hours' => 25]))
        ->toThrow(\Illuminate\Database\QueryException::class);
});

it('rejects hours not on quarter step at db level', function () {
    expect(fn () => TimeEntry::factory()->create(['hours' => 1.10]))
        ->toThrow(\Illuminate\Database\QueryException::class);
});
