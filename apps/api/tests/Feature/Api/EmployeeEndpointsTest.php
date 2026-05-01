<?php

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;

it('lists all employees ordered by name', function () {
    Employee::factory()->create(['name' => 'Zelda']);
    Employee::factory()->create(['name' => 'Alice']);

    $response = $this->getJson('/api/v1/employees');
    $response->assertOk();
    $names = collect($response->json('data'))->pluck('name')->values()->all();
    expect($names)->toBe(['Alice', 'Zelda']);
});

it('returns 304 for all employees when ETag matches', function () {
    Employee::factory()->create();

    $first = $this->getJson('/api/v1/employees');
    $etag = $first->headers->get('ETag');

    $response = $this->getJson('/api/v1/employees', ['If-None-Match' => $etag]);
    $response->assertStatus(304);
});

it('sets Cache-Control header on all employees response', function () {
    $response = $this->getJson('/api/v1/employees');
    expect($response->headers->get('Cache-Control'))->toContain('max-age=1200');
});

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
