<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyResource;
use App\Http\Resources\ProjectResource;
use App\Models\Employee;
use App\Services\EtagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function __construct(private readonly EtagService $etag) {}

    public function projects(Request $request, Employee $employee): JsonResponse
    {
        $etag = $this->etag->forQuery($employee->projects()->getQuery()); // @phpstan-ignore-line
        if ($request->headers->get('If-None-Match') === $etag) {
            return response()->json(null, 304)->header('ETag', $etag);
        }

        return ProjectResource::collection($employee->projects()->orderBy('name')->get())
            ->response()
            ->header('ETag', $etag)
            ->header('Cache-Control', 'private, max-age=60');
    }

    public function companies(Request $request, Employee $employee): JsonResponse
    {
        $etag = $this->etag->forQuery($employee->companies()->getQuery()); // @phpstan-ignore-line
        if ($request->headers->get('If-None-Match') === $etag) {
            return response()->json(null, 304)->header('ETag', $etag);
        }

        return CompanyResource::collection($employee->companies()->orderBy('name')->get())
            ->response()
            ->header('ETag', $etag)
            ->header('Cache-Control', 'private, max-age=60');
    }
}
