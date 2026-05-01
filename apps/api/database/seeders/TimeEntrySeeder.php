<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Task;
use App\Models\TimeEntry;
use Carbon\CarbonPeriod;
use Illuminate\Database\Seeder;

class TimeEntrySeeder extends Seeder
{
    public function run(): void
    {
        $start = now()->subDays(30)->startOfDay();
        $end = now()->endOfDay();
        $dates = collect(CarbonPeriod::create($start, $end))->map->format('Y-m-d');

        Employee::with(['companies', 'projects.company'])->get()->each(function (Employee $employee) use ($dates) {
            $employeeDates = $dates->shuffle()->take(rand(4, 8));
            foreach ($employeeDates as $date) {
                $project = $employee->projects->shuffle()->first();
                if (!$project) {
                    continue;
                }
                $tasks = Task::where('company_id', $project->company_id)->inRandomOrder()->limit(rand(1, 3))->get();
                foreach ($tasks as $task) {
                    TimeEntry::firstOrCreate(
                        [
                            'employee_id' => $employee->id,
                            'date' => $date,
                            'project_id' => $project->id,
                            'task_id' => $task->id,
                        ],
                        [
                            'company_id' => $project->company_id,
                            'hours' => collect([0.5, 1, 1.5, 2, 3, 4])->random(),
                            'notes' => null,
                        ]
                    );
                }
            }
        });
    }
}
