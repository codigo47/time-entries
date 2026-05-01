<?php

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\TimeEntry;

it('belongs to a company', function () {
    $company = Company::factory()->create();
    $project = Project::factory()->for($company)->create();
    expect($project->company->is($company))->toBeTrue();
});

it('belongs to many employees', function () {
    $company = Company::factory()->create();
    $project = Project::factory()->for($company)->create();
    $project->employees()->attach(Employee::factory()->create());
    expect($project->employees)->toHaveCount(1);
});

it('has many time entries', function () {
    $company = Company::factory()->create();
    $project = Project::factory()->for($company)->create();
    TimeEntry::factory()->for($project)->create();
    expect($project->timeEntries)->toHaveCount(1);
});

it('enforces unique name per company', function () {
    $company = Company::factory()->create();
    Project::factory()->for($company)->create(['name' => 'Olympus']);
    expect(fn () => Project::factory()->for($company)->create(['name' => 'Olympus']))
        ->toThrow(\Illuminate\Database\QueryException::class);
});
