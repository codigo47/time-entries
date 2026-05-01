<?php

namespace Database\Seeders;

use App\Models\Company;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder
{
    public const COMPANIES = [
        'Jupiter Industries',
        'Mars Logistics',
        'Neptune Networks',
        'Mercury Couriers',
        'Vulcan Forge',
    ];

    public function run(): void
    {
        foreach (self::COMPANIES as $name) {
            Company::firstOrCreate(['name' => $name]);
        }
    }
}
