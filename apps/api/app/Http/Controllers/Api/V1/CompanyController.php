<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyResource;
use App\Http\Resources\EmployeeResource;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\TaskResource;
use App\Models\Company;
use App\Services\EtagService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function __construct(private readonly EtagService $etag) {}

    public function index(Request $request): JsonResponse
    {
        return $this->cached($request, Company::class, fn () => Company::orderBy('name')->get(), CompanyResource::class);
    }

    public function employees(Request $request, Company $company): JsonResponse
    {
        return $this->cached(
            $request,
            $company->employees()->getQuery(), // @phpstan-ignore-line
            fn () => $company->employees()->orderBy('name')->get(),
            EmployeeResource::class,
        );
    }

    public function projects(Request $request, Company $company): JsonResponse
    {
        return $this->cached(
            $request,
            $company->projects()->getQuery(), // @phpstan-ignore-line
            fn () => $company->projects()->orderBy('name')->get(),
            ProjectResource::class,
        );
    }

    public function tasks(Request $request, Company $company): JsonResponse
    {
        return $this->cached(
            $request,
            $company->tasks()->getQuery(), // @phpstan-ignore-line
            fn () => $company->tasks()->orderBy('name')->get(),
            TaskResource::class,
        );
    }

    /**
     * @param  class-string<\Illuminate\Database\Eloquent\Model>|Builder<\Illuminate\Database\Eloquent\Model>|Relation<\Illuminate\Database\Eloquent\Model, \Illuminate\Database\Eloquent\Model, mixed>  $source
     */
    private function cached(Request $request, mixed $source, \Closure $resolver, string $resourceClass): JsonResponse
    {
        $etag = is_string($source) ? $this->etag->forModel($source) : $this->etag->forQuery($source);

        if ($request->headers->get('If-None-Match') === $etag) {
            return response()->json(null, 304)->header('ETag', $etag);
        }

        $data = $resolver();
        return $resourceClass::collection($data)
            ->response()
            ->setStatusCode(200)
            ->header('ETag', $etag)
            ->header('Cache-Control', 'private, max-age=60');
    }
}
