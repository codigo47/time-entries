<?php

use App\Models\Company;

it('lists companies with cache headers', function () {
    Company::factory()->count(3)->create();
    $response = $this->getJson('/api/v1/companies');
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(3);
    expect($response->headers->get('ETag'))->not->toBeNull();
    expect($response->headers->get('Cache-Control'))->toContain('max-age=1200');
});

it('returns 304 when If-None-Match matches', function () {
    Company::factory()->count(2)->create();
    $first = $this->getJson('/api/v1/companies');
    $etag = $first->headers->get('ETag');
    $second = $this->withHeaders(['If-None-Match' => $etag])->getJson('/api/v1/companies');
    $second->assertNoContent(304);
});

it('lists employees of a company', function () {
    $company = Company::factory()->hasAttached(\App\Models\Employee::factory()->count(2))->create();
    $response = $this->getJson("/api/v1/companies/{$company->id}/employees");
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

it('lists projects of a company', function () {
    $company = Company::factory()->create();
    \App\Models\Project::factory()->for($company)->count(3)->create();
    $response = $this->getJson("/api/v1/companies/{$company->id}/projects");
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(3);
});

it('lists tasks of a company', function () {
    $company = Company::factory()->create();
    \App\Models\Task::factory()->for($company)->count(4)->create();
    $response = $this->getJson("/api/v1/companies/{$company->id}/tasks");
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(4);
});
