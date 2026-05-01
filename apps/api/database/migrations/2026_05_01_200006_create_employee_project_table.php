<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employee_project', function (Blueprint $table) {
            $table->uuid('employee_id');
            $table->uuid('project_id');
            $table->timestamps();

            $table->primary(['employee_id', 'project_id']);
            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
            $table->index('project_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_project');
    }
};
