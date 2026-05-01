<?php

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;

it('uses uuid v7 primary key', function () {
    $company = Company::factory()->create();
    expect($company->id)->toBeString()->and(strlen($company->id))->toBe(36);
});

it('has many employees through pivot', function () {
    $company = Company::factory()->create();
    $employee = Employee::factory()->create();
    $company->employees()->attach($employee);
    expect($company->employees)->toHaveCount(1);
});

it('has many projects', function () {
    $company = Company::factory()->create();
    Project::factory()->for($company)->create();
    expect($company->projects)->toHaveCount(1);
});

it('has many tasks', function () {
    $company = Company::factory()->create();
    Task::factory()->for($company)->create();
    expect($company->tasks)->toHaveCount(1);
});

it('has many time entries', function () {
    $company = Company::factory()->create();
    TimeEntry::factory()->for($company)->create();
    expect($company->timeEntries)->toHaveCount(1);
});
