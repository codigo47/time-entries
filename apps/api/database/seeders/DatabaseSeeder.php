<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CompanySeeder::class,
            EmployeeSeeder::class,
            CompanyEmployeeSeeder::class,
            ProjectSeeder::class,
            TaskSeeder::class,
            EmployeeProjectSeeder::class,
            TimeEntrySeeder::class,
        ]);
    }
}
