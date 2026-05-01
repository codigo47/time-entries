<?php

namespace App\Http\Resources;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var Employee $model */
        $model = $this->resource;
        return [
            'id' => $model->id,
            'name' => $model->name,
            'email' => $model->email,
        ];
    }
}
