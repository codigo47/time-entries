<?php

use App\Http\Requests\StoreTimeEntryRequest;
use Illuminate\Support\Facades\Validator;

it('validates hours quarter step', function () {
    $rules = (new StoreTimeEntryRequest())->rules();
    $v = Validator::make([
        'company_id' => fake()->uuid(),
        'employee_id' => fake()->uuid(),
        'project_id' => fake()->uuid(),
        'task_id' => fake()->uuid(),
        'date' => '2026-05-01',
        'hours' => 0.3,
        'notes' => null,
    ], $rules);
    expect($v->fails())->toBeTrue();
    expect($v->errors()->has('hours'))->toBeTrue();
});

it('rejects future dates beyond 7 days', function () {
    $rules = (new StoreTimeEntryRequest())->rules();
    $v = Validator::make([
        'company_id' => fake()->uuid(),
        'employee_id' => fake()->uuid(),
        'project_id' => fake()->uuid(),
        'task_id' => fake()->uuid(),
        'date' => now()->addDays(30)->toDateString(),
        'hours' => 1.0,
        'notes' => null,
    ], $rules);
    expect($v->fails())->toBeTrue();
});
