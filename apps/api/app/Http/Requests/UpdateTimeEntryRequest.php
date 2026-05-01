<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\TimeEntryRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTimeEntryRequest extends FormRequest
{
    use TimeEntryRules;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        $rules = $this->rowRules();
        // PATCH semantics: each field optional but if present must validate
        return array_map(fn (array $r) => array_map(
            fn ($v) => $v === 'required' ? 'sometimes' : $v,
            $r,
        ), $rules);
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return $this->rowMessages();
    }
}
