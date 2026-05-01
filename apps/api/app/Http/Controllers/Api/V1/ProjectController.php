<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\EmployeeResource;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Services\EtagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(private readonly EtagService $etag) {}

    public function index(Request $request): JsonResponse
    {
        $etag = $this->etag->forModel(Project::class);
        if ($request->headers->get('If-None-Match') === $etag) {
            return response()->json(null, 304)->header('ETag', $etag);
        }

        return ProjectResource::collection(Project::orderBy('name')->get())
            ->response()
            ->header('ETag', $etag)
            ->header('Cache-Control', 'private, max-age=1200');
    }

    public function employees(Request $request, Project $project): JsonResponse
    {
        $etag = $this->etag->forQuery($project->employees()->getQuery()); // @phpstan-ignore-line

        if ($request->headers->get('If-None-Match') === $etag) {
            return response()->json(null, 304)->header('ETag', $etag);
        }

        return EmployeeResource::collection($project->employees()->orderBy('name')->get())
            ->response()
            ->setStatusCode(200)
            ->header('ETag', $etag)
            ->header('Cache-Control', 'private, max-age=1200');
    }
}
