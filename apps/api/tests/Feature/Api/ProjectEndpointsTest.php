<?php

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;

it('lists all projects ordered by name', function () {
    $company = Company::factory()->create();
    Project::factory()->for($company)->create(['name' => 'Zebra']);
    Project::factory()->for($company)->create(['name' => 'Alpha']);

    $response = $this->getJson('/api/v1/projects');
    $response->assertOk();
    $names = collect($response->json('data'))->pluck('name')->values()->all();
    expect($names)->toBe(['Alpha', 'Zebra']);
});

it('returns 304 for all projects when ETag matches', function () {
    $company = Company::factory()->create();
    Project::factory()->for($company)->create();

    $first = $this->getJson('/api/v1/projects');
    $etag = $first->headers->get('ETag');

    $response = $this->getJson('/api/v1/projects', ['If-None-Match' => $etag]);
    $response->assertStatus(304);
});

it('sets Cache-Control header on all projects response', function () {
    $response = $this->getJson('/api/v1/projects');
    expect($response->headers->get('Cache-Control'))->toContain('max-age=1200');
});

it('lists employees of a project ordered by name', function () {
    $company = Company::factory()->create();
    $project = Project::factory()->for($company)->create();
    $zebra = Employee::factory()->create(['name' => 'Zebra']);
    $alpha = Employee::factory()->create(['name' => 'Alpha']);
    $project->employees()->attach([$zebra->id, $alpha->id]);

    $response = $this->getJson("/api/v1/projects/{$project->id}/employees");
    $response->assertOk();
    $names = collect($response->json('data'))->pluck('name')->values()->all();
    expect($names)->toBe(['Alpha', 'Zebra']);
});

it('returns 304 for project employees when ETag matches', function () {
    $company = Company::factory()->create();
    $project = Project::factory()->for($company)->create();
    $employee = Employee::factory()->create();
    $project->employees()->attach($employee->id);

    $first = $this->getJson("/api/v1/projects/{$project->id}/employees");
    $etag = $first->headers->get('ETag');

    $response = $this->getJson("/api/v1/projects/{$project->id}/employees", ['If-None-Match' => $etag]);
    $response->assertStatus(304);
});

it('sets Cache-Control header on project employees response', function () {
    $company = Company::factory()->create();
    $project = Project::factory()->for($company)->create();

    $response = $this->getJson("/api/v1/projects/{$project->id}/employees");
    $response->assertOk();
    expect($response->headers->get('Cache-Control'))->toContain('max-age=1200');
});

it('returns empty list when project has no employees', function () {
    $company = Company::factory()->create();
    $project = Project::factory()->for($company)->create();

    $response = $this->getJson("/api/v1/projects/{$project->id}/employees");
    $response->assertOk();
    expect($response->json('data'))->toBe([]);
});
