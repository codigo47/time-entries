<?php

namespace App\Actions;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use OpenAI\Laravel\Facades\OpenAI;

class ParseTimeEntryText
{
    /** @return array{rows: array<int, array<string, mixed>>} */
    public function execute(string $text): array
    {
        if (! config('openai.api_key')) {
            return ['rows' => []];
        }

        $context = $this->buildContext();

        $response = OpenAI::chat()->create([
            'model' => config('openai.model', 'gpt-4o-mini'),
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                ['role' => 'system', 'content' => 'You parse natural-language time-entry descriptions into structured rows. Use ONLY names that exist in the provided directory. Output JSON: {"rows":[{"company_name","employee_name","project_name","task_name","date","hours","notes"}]}.'],
                ['role' => 'user', 'content' => "Directory:\n".$context."\n\nUser text:\n".$text],
            ],
        ]);

        $payload = json_decode($response->choices[0]->message->content ?? '{}', true);
        $raw = $payload['rows'] ?? [];

        return ['rows' => array_values(array_map(fn ($r) => $this->resolveNamesToIds($r), $raw))];
    }

    private function buildContext(): string
    {
        $companies = Company::with(['employees:id,name', 'projects:id,company_id,name', 'tasks:id,company_id,name'])->get();
        return $companies->map(function (Company $c) {
            return sprintf(
                "Company: %s\n  Employees: %s\n  Projects: %s\n  Tasks: %s",
                $c->name,
                $c->employees->pluck('name')->join(', '),
                $c->projects->pluck('name')->join(', '),
                $c->tasks->pluck('name')->join(', '),
            );
        })->implode("\n\n");
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function resolveNamesToIds(array $row): array
    {
        $company = Company::where('name', $row['company_name'] ?? '')->first();
        $employee = Employee::where('name', $row['employee_name'] ?? '')->first();
        $project = $company ? Project::where('company_id', $company->id)->where('name', $row['project_name'] ?? '')->first() : null;
        $task = $company ? Task::where('company_id', $company->id)->where('name', $row['task_name'] ?? '')->first() : null;

        return [
            'company_id' => $company?->id,
            'employee_id' => $employee?->id,
            'project_id' => $project?->id,
            'task_id' => $task?->id,
            'date' => $row['date'] ?? null,
            'hours' => $row['hours'] ?? null,
            'notes' => $row['notes'] ?? null,
        ];
    }
}
