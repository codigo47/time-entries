<?php

use App\Models\Company;
use App\Services\EtagService;

it('produces a stable etag for a model class', function () {
    Company::factory()->count(2)->create();
    $service = new EtagService();
    $etag1 = $service->forModel(Company::class);
    $etag2 = $service->forModel(Company::class);
    expect($etag1)->toBe($etag2);
});

it('changes when data changes', function () {
    $service = new EtagService();
    Company::factory()->create();
    $a = $service->forModel(Company::class);
    sleep(1);
    Company::factory()->create();
    $b = $service->forModel(Company::class);
    expect($a)->not->toBe($b);
});

it('scopes by query', function () {
    $companyA = Company::factory()->create();
    $companyB = Company::factory()->create();
    // Give companyA an employee so the two scoped queries return different results
    $employee = \App\Models\Employee::factory()->create();
    $employee->companies()->attach($companyA);
    $service = new EtagService();
    $tagA = $service->forQuery($companyA->employees());
    $tagB = $service->forQuery($companyB->employees());
    expect($tagA)->not->toBe($tagB);
});
