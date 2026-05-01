<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\CreateTimeEntries;
use App\Actions\ParseTimeEntryText;
use App\Actions\UpdateTimeEntry;
use App\Exceptions\TimeEntryValidationException;
use App\Http\Controllers\Controller;
use App\Http\Requests\BatchStoreTimeEntryRequest;
use App\Http\Requests\ParseTimeEntryRequest;
use App\Http\Requests\StoreTimeEntryRequest;
use App\Http\Requests\UpdateTimeEntryRequest;
use App\Http\Resources\TimeEntryResource;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TimeEntryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 25), 100);

        $query = QueryBuilder::for(TimeEntry::class)
            ->allowedFilters(
                AllowedFilter::exact('company_id'),
                AllowedFilter::exact('employee_id'),
                AllowedFilter::exact('project_id'),
                AllowedFilter::exact('task_id'),
                AllowedFilter::callback('date_from', fn ($q, $v) => $q->where('date', '>=', $v)),
                AllowedFilter::callback('date_to', fn ($q, $v) => $q->where('date', '<=', $v)),
                AllowedFilter::callback('q', function ($builder, $v) {
                    $like = '%'.$v.'%';
                    $builder->where(function ($w) use ($like) {
                        $w->where('notes', 'ilike', $like)
                          ->orWhereHas('company', fn ($q) => $q->where('name', 'ilike', $like))
                          ->orWhereHas('project', fn ($q) => $q->where('name', 'ilike', $like))
                          ->orWhereHas('task', fn ($q) => $q->where('name', 'ilike', $like))
                          ->orWhereHas('employee', fn ($q) => $q->where('name', 'ilike', $like));
                    });
                }),
            )
            ->allowedSorts('date', 'hours', 'created_at')
            ->defaultSort('-date')
            ->with(['company', 'employee', 'project', 'task']);

        return TimeEntryResource::collection($query->paginate($perPage)->appends($request->query()))
            ->response();
    }

    public function show(TimeEntry $timeEntry): JsonResponse
    {
        $timeEntry->load(['company', 'employee', 'project', 'task']);
        return (new TimeEntryResource($timeEntry))->response();
    }

    public function store(StoreTimeEntryRequest $request, CreateTimeEntries $action): JsonResponse
    {
        try {
            $entries = $action->execute([$request->validated()]);
        } catch (TimeEntryValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $this->stripBatchPrefix($e->errors)], 422);
        }

        $entries[0]->load(['company', 'employee', 'project', 'task']);
        return (new TimeEntryResource($entries[0]))->response()->setStatusCode(201);
    }

    public function batch(BatchStoreTimeEntryRequest $request, CreateTimeEntries $action): JsonResponse
    {
        try {
            $entries = $action->execute($request->validated()['entries']);
        } catch (TimeEntryValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors], 422);
        }

        foreach ($entries as $e) {
            $e->load(['company', 'employee', 'project', 'task']);
        }
        return TimeEntryResource::collection($entries)->response()->setStatusCode(201);
    }

    public function update(UpdateTimeEntryRequest $request, TimeEntry $timeEntry, UpdateTimeEntry $action): JsonResponse
    {
        try {
            $updated = $action->execute($timeEntry, $request->validated());
        } catch (TimeEntryValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors], 422);
        }
        $updated->load(['company', 'employee', 'project', 'task']);
        return (new TimeEntryResource($updated))->response();
    }

    public function destroy(TimeEntry $timeEntry): JsonResponse
    {
        $timeEntry->delete();
        return response()->json(null, 204);
    }

    public function summary(Request $request): JsonResponse
    {
        $allowed = ['employee', 'project', 'task', 'date', 'company'];
        $groupBy = in_array($request->query('group_by'), $allowed, true) ? $request->query('group_by') : 'employee';
        $col = $groupBy === 'date' ? 'date' : "{$groupBy}_id";

        $query = QueryBuilder::for(TimeEntry::class)
            ->allowedFilters(
                AllowedFilter::exact('company_id'),
                AllowedFilter::exact('employee_id'),
                AllowedFilter::exact('project_id'),
                AllowedFilter::exact('task_id'),
                AllowedFilter::callback('date_from', fn ($q, $v) => $q->where('date', '>=', $v)),
                AllowedFilter::callback('date_to', fn ($q, $v) => $q->where('date', '<=', $v)),
                AllowedFilter::callback('q', function ($builder, $v) {
                    $like = '%'.$v.'%';
                    $builder->where(function ($w) use ($like) {
                        $w->where('notes', 'ilike', $like)
                          ->orWhereHas('company', fn ($q) => $q->where('name', 'ilike', $like))
                          ->orWhereHas('project', fn ($q) => $q->where('name', 'ilike', $like))
                          ->orWhereHas('task', fn ($q) => $q->where('name', 'ilike', $like))
                          ->orWhereHas('employee', fn ($q) => $q->where('name', 'ilike', $like));
                    });
                }),
            )
            ->getEloquentBuilder()
            ->selectRaw("$col as group_key, SUM(hours) as total_hours, COUNT(*) as entry_count")
            ->groupBy($col)
            ->orderBy('group_key');

        /** @var \Illuminate\Support\Collection<int, \stdClass> $rows */
        $rows = $query->get()->map(fn ($row) => (object) $row->getAttributes());

        if ($groupBy !== 'date') {
            $ids = $rows->pluck('group_key')->filter()->values()->all();
            $labels = match ($groupBy) {
                'employee' => Employee::whereIn('id', $ids)->pluck('name', 'id'),
                'project'  => Project::whereIn('id', $ids)->pluck('name', 'id'),
                'task'     => Task::whereIn('id', $ids)->pluck('name', 'id'),
                default    => Company::whereIn('id', $ids)->pluck('name', 'id'),
            };
            $rows = $rows->map(fn (\stdClass $row) => [
                'group_key'   => $row->group_key,
                'group_label' => $labels[$row->group_key] ?? $row->group_key,
                'total_hours' => $row->total_hours,
                'entry_count' => $row->entry_count,
            ]);
        } else {
            $rows = $rows->map(fn (\stdClass $row) => [
                'group_key'   => $row->group_key,
                'group_label' => $row->group_key,
                'total_hours' => $row->total_hours,
                'entry_count' => $row->entry_count,
            ]);
        }

        return response()->json(['data' => $rows, 'meta' => ['group_by' => $groupBy]]);
    }

    public function parse(ParseTimeEntryRequest $request, ParseTimeEntryText $action): JsonResponse
    {
        $result = $action->execute($request->validated()['text']);
        return response()->json($result);
    }

    /**
     * @param  array<string, array<string>>  $errors
     * @return array<string, array<string>>
     */
    private function stripBatchPrefix(array $errors): array
    {
        $out = [];
        foreach ($errors as $key => $msgs) {
            $clean = (string) preg_replace('/^entries\.\d+\./', '', $key);
            $out[$clean] = $msgs;
        }
        return $out;
    }
}
