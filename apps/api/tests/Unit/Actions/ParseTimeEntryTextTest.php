<?php

use App\Actions\ParseTimeEntryText;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use OpenAI\Laravel\Facades\OpenAI;

it('returns an empty array if no key configured', function () {
    config(['openai.api_key' => null]);
    $action = app(ParseTimeEntryText::class);
    $result = $action->execute('John worked on Project X for 2 hours on 2026-01-01');
    expect($result)->toBe(['rows' => []]);
});

it('parses a sentence into a draft row using the configured model', function () {
    config(['openai.api_key' => 'test-key']);
    $company = Company::factory()->create(['name' => 'Jupiter Industries']);
    $employee = Employee::factory()->create(['name' => 'Athena Pallas']);
    $employee->companies()->attach($company);
    $project = Project::factory()->for($company)->create(['name' => 'Olympus CRM']);
    $employee->projects()->attach($project);
    $task = Task::factory()->for($company)->create(['name' => 'Cleanup']);

    OpenAI::fake([
        \OpenAI\Responses\Chat\CreateResponse::fake([
            'choices' => [[
                'message' => [
                    'content' => json_encode(['rows' => [[
                        'company_name' => 'Jupiter Industries',
                        'employee_name' => 'Athena Pallas',
                        'project_name' => 'Olympus CRM',
                        'task_name' => 'Cleanup',
                        'date' => '2026-05-01',
                        'hours' => 2.0,
                        'notes' => null,
                    ]]]),
                ],
            ]],
        ]),
    ]);

    $action = app(ParseTimeEntryText::class);
    $result = $action->execute('Athena worked on Olympus CRM doing cleanup for 2 hours on 2026-05-01');

    expect($result['rows'])->toHaveCount(1);
    expect($result['rows'][0]['company_id'])->toBe($company->id);
    expect($result['rows'][0]['employee_id'])->toBe($employee->id);
    expect($result['rows'][0]['project_id'])->toBe($project->id);
    expect($result['rows'][0]['task_id'])->toBe($task->id);
    expect((float) $result['rows'][0]['hours'])->toBe(2.0);
});
