<?php

use App\Models\Company;
use App\Models\Task;
use App\Models\TimeEntry;

it('belongs to a company', function () {
    $company = Company::factory()->create();
    $task = Task::factory()->for($company)->create();
    expect($task->company->is($company))->toBeTrue();
});

it('has many time entries', function () {
    $company = Company::factory()->create();
    $task = Task::factory()->for($company)->create();
    TimeEntry::factory()->for($task)->create();
    expect($task->timeEntries)->toHaveCount(1);
});

it('enforces unique name per company', function () {
    $company = Company::factory()->create();
    Task::factory()->for($company)->create(['name' => 'Development']);
    expect(fn () => Task::factory()->for($company)->create(['name' => 'Development']))
        ->toThrow(\Illuminate\Database\QueryException::class);
});
