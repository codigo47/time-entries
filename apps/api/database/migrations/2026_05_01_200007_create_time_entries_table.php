<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('time_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->uuid('employee_id');
            $table->uuid('project_id');
            $table->uuid('task_id');
            $table->date('date');
            $table->decimal('hours', 4, 2);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();
            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();

            $table->unique(['employee_id', 'date', 'project_id', 'task_id'], 'time_entries_unique_dup');
            $table->index(['company_id', 'date']);
            $table->index(['employee_id', 'date']);
            $table->index('project_id');
            $table->index('task_id');
        });

        DB::statement("ALTER TABLE time_entries ADD CONSTRAINT time_entries_hours_range CHECK (hours > 0 AND hours <= 24)");
        DB::statement("ALTER TABLE time_entries ADD CONSTRAINT time_entries_hours_step CHECK (hours = ROUND(hours * 4) / 4)");
    }

    public function down(): void
    {
        Schema::dropIfExists('time_entries');
    }
};
