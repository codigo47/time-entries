<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\TimeEntryRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreTimeEntryRequest extends FormRequest
{
    use TimeEntryRules;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return $this->rowRules();
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return $this->rowMessages();
    }
}
