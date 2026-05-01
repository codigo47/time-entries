<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Project;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public const PROJECTS = [
        'Pantheon Migration',
        'Olympus CRM',
        'Stoa Refactor',
        'Dialectic Analytics',
    ];

    public function run(): void
    {
        Company::all()->each(function (Company $company) {
            foreach (self::PROJECTS as $name) {
                Project::firstOrCreate([
                    'company_id' => $company->id,
                    'name' => $name,
                ]);
            }
        });
    }
}
