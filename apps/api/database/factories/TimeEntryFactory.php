<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;
use Illuminate\Database\Eloquent\Factories\Factory;

class TimeEntryFactory extends Factory
{
    protected $model = TimeEntry::class;

    public function definition(): array
    {
        $company = Company::factory()->create();
        $project = Project::factory()->for($company)->create();
        $task = Task::factory()->for($company)->create();
        $employee = Employee::factory()->create();
        $employee->companies()->attach($company);
        $employee->projects()->attach($project);

        return [
            'company_id' => $company->id,
            'employee_id' => $employee->id,
            'project_id' => $project->id,
            'task_id' => $task->id,
            'date' => $this->faker->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'hours' => $this->faker->randomElement([0.25, 0.5, 1.0, 2.0, 3.0, 4.0, 6.0, 8.0]),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
