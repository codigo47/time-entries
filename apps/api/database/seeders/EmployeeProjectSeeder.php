<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Project;
use Illuminate\Database\Seeder;

class EmployeeProjectSeeder extends Seeder
{
    public function run(): void
    {
        Employee::with('companies')->get()->each(function (Employee $employee) {
            $companyIds = $employee->companies->pluck('id');
            $projects = Project::whereIn('company_id', $companyIds)->inRandomOrder()->limit(3)->get();
            foreach ($projects as $project) {
                if (!$employee->projects()->where('projects.id', $project->id)->exists()) {
                    $employee->projects()->attach($project->id);
                }
            }
        });
    }
}
