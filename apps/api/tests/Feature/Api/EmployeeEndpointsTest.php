<?php

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;

it('lists projects an employee is on', function () {
    $employee = Employee::factory()->create();
    $company = Company::factory()->create();
    $employee->companies()->attach($company);
    $project = Project::factory()->for($company)->create();
    $employee->projects()->attach($project);

    $response = $this->getJson("/api/v1/employees/{$employee->id}/projects");
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
});

it('lists companies an employee belongs to', function () {
    $employee = Employee::factory()->create();
    $employee->companies()->attach(Company::factory()->create());
    $response = $this->getJson("/api/v1/employees/{$employee->id}/companies");
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
});
