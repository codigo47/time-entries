<?php

namespace App\Http\Resources;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var Task $model */
        $model = $this->resource;
        return [
            'id' => $model->id,
            'company_id' => $model->company_id,
            'name' => $model->name,
        ];
    }
}
