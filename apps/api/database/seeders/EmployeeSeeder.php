<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EmployeeSeeder extends Seeder
{
    public const EMPLOYEES = [
        'Athena Pallas',
        'Apollo Helios',
        'Artemis Selene',
        'Hermes Trismegistus',
        'Dionysus Bacchus',
        'Hera Olympia',
        'Demeter Ceres',
        'Hades Pluto',
        'Michel Foucault',
        'Judith Butler',
        'Slavoj Zizek',
        'Byung-Chul Han',
    ];

    public function run(): void
    {
        foreach (self::EMPLOYEES as $name) {
            Employee::firstOrCreate(
                ['email' => Str::slug($name, '.').'@example.test'],
                ['name' => $name],
            );
        }
    }
}
