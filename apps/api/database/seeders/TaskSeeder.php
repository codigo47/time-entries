<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Task;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    public const TASKS = [
        'Development',
        'QA Testing',
        'Code Review',
        'Documentation',
        'Cleanup',
        'Deployment',
    ];

    public function run(): void
    {
        Company::all()->each(function (Company $company) {
            foreach (self::TASKS as $name) {
                Task::firstOrCreate([
                    'company_id' => $company->id,
                    'name' => $name,
                ]);
            }
        });
    }
}
