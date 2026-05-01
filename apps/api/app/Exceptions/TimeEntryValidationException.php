<?php

namespace App\Exceptions;

use Exception;

class TimeEntryValidationException extends Exception
{
    /** @param  array<string, array<string>>  $errors */
    public function __construct(public readonly array $errors, string $message = 'Validation failed for one or more entries.')
    {
        parent::__construct($message);
    }
}
