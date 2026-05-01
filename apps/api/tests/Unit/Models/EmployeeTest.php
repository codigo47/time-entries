<?php

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\TimeEntry;

it('belongs to many companies', function () {
    $employee = Employee::factory()->create();
    $employee->companies()->attach(Company::factory()->create());
    expect($employee->companies)->toHaveCount(1);
});

it('belongs to many projects', function () {
    $employee = Employee::factory()->create();
    $company = Company::factory()->create();
    $project = Project::factory()->for($company)->create();
    $employee->projects()->attach($project);
    expect($employee->projects)->toHaveCount(1);
});

it('has many time entries', function () {
    $employee = Employee::factory()->create();
    TimeEntry::factory()->for($employee)->create();
    expect($employee->timeEntries)->toHaveCount(1);
});

it('has unique email', function () {
    Employee::factory()->create(['email' => 'a@example.com']);
    expect(fn () => Employee::factory()->create(['email' => 'a@example.com']))
        ->toThrow(\Illuminate\Database\QueryException::class);
});
