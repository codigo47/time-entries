<?php

namespace App\Http\Resources;

use App\Models\TimeEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TimeEntryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var TimeEntry $model */
        $model = $this->resource;
        return [
            'id' => $model->id,
            'company' => new CompanyResource($this->whenLoaded('company')),
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'project' => new ProjectResource($this->whenLoaded('project')),
            'task' => new TaskResource($this->whenLoaded('task')),
            'company_id' => $model->company_id,
            'employee_id' => $model->employee_id,
            'project_id' => $model->project_id,
            'task_id' => $model->task_id,
            'date' => $model->date->toDateString(),
            'hours' => (float) $model->hours,
            'notes' => $model->notes,
            'created_at' => $model->created_at?->toIso8601String(),
            'updated_at' => $model->updated_at?->toIso8601String(),
        ];
    }
}
