<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\TimeEntryRules;
use Illuminate\Foundation\Http\FormRequest;

class BatchStoreTimeEntryRequest extends FormRequest
{
    use TimeEntryRules;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return array_merge(
            ['entries' => ['required', 'array', 'min:1', 'max:200']],
            $this->rowRules('entries.*.'),
        );
    }
}
