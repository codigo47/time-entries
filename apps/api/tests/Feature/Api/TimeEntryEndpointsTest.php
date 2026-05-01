<?php

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;

beforeEach(function () {
    $this->company = Company::factory()->create();
    $this->employee = Employee::factory()->create();
    $this->employee->companies()->attach($this->company);
    $this->project = Project::factory()->for($this->company)->create();
    $this->employee->projects()->attach($this->project);
    $this->task = Task::factory()->for($this->company)->create();
});

it('GET /time-entries paginates', function () {
    TimeEntry::factory()->count(30)->create();
    $response = $this->getJson('/api/v1/time-entries?per_page=10');
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(10);
    expect($response->json('meta.total'))->toBe(30);
});

it('GET /time-entries supports filtering by company_id', function () {
    TimeEntry::factory()->count(5)->create();
    TimeEntry::factory()->count(2)->for($this->company)->create([
        'employee_id' => $this->employee->id,
        'project_id' => $this->project->id,
        'task_id' => $this->task->id,
    ]);
    $response = $this->getJson("/api/v1/time-entries?filter[company_id]={$this->company->id}");
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

it('POST /time-entries creates one entry', function () {
    $payload = [
        'company_id' => $this->company->id,
        'employee_id' => $this->employee->id,
        'project_id' => $this->project->id,
        'task_id' => $this->task->id,
        'date' => '2026-05-01',
        'hours' => 2.0,
        'notes' => 'Refactor',
    ];
    $response = $this->postJson('/api/v1/time-entries', $payload);
    $response->assertCreated();
    expect(TimeEntry::count())->toBe(1);
});

it('POST /time-entries/batch creates multiple entries in one transaction', function () {
    $task2 = Task::factory()->for($this->company)->create();
    $response = $this->postJson('/api/v1/time-entries/batch', [
        'entries' => [
            ['company_id' => $this->company->id, 'employee_id' => $this->employee->id, 'project_id' => $this->project->id, 'task_id' => $this->task->id, 'date' => '2026-05-01', 'hours' => 1.0, 'notes' => null],
            ['company_id' => $this->company->id, 'employee_id' => $this->employee->id, 'project_id' => $this->project->id, 'task_id' => $task2->id, 'date' => '2026-05-01', 'hours' => 2.0, 'notes' => null],
        ],
    ]);
    $response->assertCreated();
    expect(TimeEntry::count())->toBe(2);
});

it('POST /time-entries/batch returns row-keyed errors on conflict', function () {
    $other = Project::factory()->for($this->company)->create();
    $this->employee->projects()->attach($other);

    $response = $this->postJson('/api/v1/time-entries/batch', [
        'entries' => [
            ['company_id' => $this->company->id, 'employee_id' => $this->employee->id, 'project_id' => $this->project->id, 'task_id' => $this->task->id, 'date' => '2026-05-01', 'hours' => 1.0, 'notes' => null],
            ['company_id' => $this->company->id, 'employee_id' => $this->employee->id, 'project_id' => $other->id, 'task_id' => $this->task->id, 'date' => '2026-05-01', 'hours' => 1.0, 'notes' => null],
        ],
    ]);
    $response->assertStatus(422);
    expect($response->json('errors'))->toHaveKey('entries.1.project_id');
    expect(TimeEntry::count())->toBe(0);
});

it('PATCH /time-entries/{id} updates fields', function () {
    $entry = TimeEntry::factory()->create();
    $response = $this->patchJson("/api/v1/time-entries/{$entry->id}", ['hours' => 5.0, 'notes' => 'Edited']);
    $response->assertOk();
    expect((float) $response->json('data.hours'))->toBe(5.0);
});

it('DELETE /time-entries/{id} deletes the entry', function () {
    $entry = TimeEntry::factory()->create();
    $this->deleteJson("/api/v1/time-entries/{$entry->id}")->assertNoContent();
    expect(TimeEntry::count())->toBe(0);
});

it('GET /time-entries/summary returns totals by group with group_label for date', function () {
    TimeEntry::factory()->count(3)->create(['hours' => 1.0, 'date' => '2026-05-01']);
    $response = $this->getJson('/api/v1/time-entries/summary?group_by=date');
    $response->assertOk();
    expect($response->json('meta.group_by'))->toBe('date');
    $data = $response->json('data');
    expect($data)->not->toBeEmpty();
    expect($data[0])->toHaveKey('group_label');
    expect($data[0]['group_label'])->toBe($data[0]['group_key']);
});

it('GET /time-entries/summary returns human-readable group_label for employee', function () {
    TimeEntry::factory()->create([
        'company_id'  => $this->company->id,
        'employee_id' => $this->employee->id,
        'project_id'  => $this->project->id,
        'task_id'     => $this->task->id,
        'date'        => '2026-04-25',
        'hours'       => 3.0,
    ]);
    TimeEntry::factory()->create([
        'company_id'  => $this->company->id,
        'employee_id' => $this->employee->id,
        'project_id'  => $this->project->id,
        'task_id'     => $this->task->id,
        'date'        => '2026-04-26',
        'hours'       => 3.0,
    ]);
    $response = $this->getJson('/api/v1/time-entries/summary?group_by=employee');
    $response->assertOk();
    $data = $response->json('data');
    expect($data)->not->toBeEmpty();
    $row = collect($data)->firstWhere('group_key', $this->employee->id);
    expect($row)->not->toBeNull();
    expect($row['group_label'])->toBe($this->employee->name);
});

it('GET /time-entries/summary returns human-readable group_label for company', function () {
    TimeEntry::factory()->create([
        'company_id'  => $this->company->id,
        'employee_id' => $this->employee->id,
        'project_id'  => $this->project->id,
        'task_id'     => $this->task->id,
        'date'        => '2026-04-25',
        'hours'       => 2.0,
    ]);
    TimeEntry::factory()->create([
        'company_id'  => $this->company->id,
        'employee_id' => $this->employee->id,
        'project_id'  => $this->project->id,
        'task_id'     => $this->task->id,
        'date'        => '2026-04-26',
        'hours'       => 2.0,
    ]);
    $response = $this->getJson('/api/v1/time-entries/summary?group_by=company');
    $response->assertOk();
    $data = $response->json('data');
    $row = collect($data)->firstWhere('group_key', $this->company->id);
    expect($row)->not->toBeNull();
    expect($row['group_label'])->toBe($this->company->name);
});

it('GET /time-entries supports search across notes, company, project, employee, task names', function () {
    $cA = \App\Models\Company::factory()->create(['name' => 'Acme Industries']);
    $cB = \App\Models\Company::factory()->create(['name' => 'Globex Corp']);
    $eA = \App\Models\Employee::factory()->create(['name' => 'Athena Pallas']);
    $eA->companies()->attach([$cA->id, $cB->id]);
    $pA = \App\Models\Project::factory()->for($cA)->create(['name' => 'Olympus']);
    $pB = \App\Models\Project::factory()->for($cB)->create(['name' => 'Pyramid']);
    $eA->projects()->attach([$pA->id, $pB->id]);
    $tA = \App\Models\Task::factory()->for($cA)->create(['name' => 'Cleanup']);
    $tB = \App\Models\Task::factory()->for($cB)->create(['name' => 'Refactor']);

    \App\Models\TimeEntry::factory()->create([
        'company_id' => $cA->id, 'employee_id' => $eA->id, 'project_id' => $pA->id, 'task_id' => $tA->id,
        'date' => '2026-04-01', 'hours' => 4, 'notes' => 'Migration prep work',
    ]);
    \App\Models\TimeEntry::factory()->create([
        'company_id' => $cB->id, 'employee_id' => $eA->id, 'project_id' => $pB->id, 'task_id' => $tB->id,
        'date' => '2026-04-02', 'hours' => 4, 'notes' => null,
    ]);

    // Search by company name
    $r1 = $this->getJson('/api/v1/time-entries?filter[q]=Acme');
    $r1->assertOk();
    expect($r1->json('data'))->toHaveCount(1);

    // Search by project name
    $r2 = $this->getJson('/api/v1/time-entries?filter[q]=Pyramid');
    expect($r2->json('data'))->toHaveCount(1);

    // Search by task name
    $r3 = $this->getJson('/api/v1/time-entries?filter[q]=Refactor');
    expect($r3->json('data'))->toHaveCount(1);

    // Search by employee name
    $r4 = $this->getJson('/api/v1/time-entries?filter[q]=Athena');
    expect($r4->json('data'))->toHaveCount(2);

    // Search by notes
    $r5 = $this->getJson('/api/v1/time-entries?filter[q]=Migration');
    expect($r5->json('data'))->toHaveCount(1);

    // No matches
    $r6 = $this->getJson('/api/v1/time-entries?filter[q]=Nonexistent');
    expect($r6->json('data'))->toHaveCount(0);
});

it('POST /time-entries/parse returns empty rows when no AI key', function () {
    config(['openai.api_key' => null]);
    $response = $this->postJson('/api/v1/time-entries/parse', ['text' => 'Athena did stuff']);
    $response->assertOk();
    expect($response->json('rows'))->toBe([]);
});
