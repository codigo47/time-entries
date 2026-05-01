<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Employee;
use Illuminate\Database\Seeder;

class CompanyEmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $companies = Company::all();
        $employees = Employee::all();

        foreach ($employees as $i => $employee) {
            // Assign 2-3 companies per employee, deterministic by index
            $count = 2 + ($i % 2);
            $picks = $companies->shuffle()->take($count);
            foreach ($picks as $company) {
                if (!$employee->companies()->where('companies.id', $company->id)->exists()) {
                    $employee->companies()->attach($company->id);
                }
            }
        }
    }
}
