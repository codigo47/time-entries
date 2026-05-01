<?php

use App\Http\Controllers\Api\V1\CompanyController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['ok' => true]));

Route::get('companies', [CompanyController::class, 'index']);
Route::get('companies/{company}/employees', [CompanyController::class, 'employees']);
Route::get('companies/{company}/projects', [CompanyController::class, 'projects']);
Route::get('companies/{company}/tasks', [CompanyController::class, 'tasks']);

Route::get('employees/{employee}/projects', [\App\Http\Controllers\Api\V1\EmployeeController::class, 'projects']);
Route::get('employees/{employee}/companies', [\App\Http\Controllers\Api\V1\EmployeeController::class, 'companies']);

Route::get('time-entries', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'index']);
Route::get('time-entries/summary', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'summary']);
Route::post('time-entries/parse', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'parse'])
    ->middleware('throttle:10,1');
Route::post('time-entries/batch', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'batch']);
Route::post('time-entries', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'store']);
Route::get('time-entries/{timeEntry}', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'show']);
Route::patch('time-entries/{timeEntry}', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'update']);
Route::delete('time-entries/{timeEntry}', [\App\Http\Controllers\Api\V1\TimeEntryController::class, 'destroy']);
