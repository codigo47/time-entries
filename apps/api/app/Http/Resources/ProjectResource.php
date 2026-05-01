<?php

namespace App\Http\Resources;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var Project $model */
        $model = $this->resource;
        return [
            'id' => $model->id,
            'company_id' => $model->company_id,
            'name' => $model->name,
        ];
    }
}
