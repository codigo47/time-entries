<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;

class EtagService
{
    /**
     * @param  class-string<\Illuminate\Database\Eloquent\Model>  $modelClass
     */
    public function forModel(string $modelClass): string
    {
        return $this->forQuery($modelClass::query());
    }

    /**
     * @param  Builder<\Illuminate\Database\Eloquent\Model>|Relation<\Illuminate\Database\Eloquent\Model, \Illuminate\Database\Eloquent\Model, mixed>  $query
     */
    public function forQuery(Builder|Relation $query): string
    {
        $cloneCount = clone $query;
        $cloneMax = clone $query;
        $count = $cloneCount->count();

        // Qualify updated_at with the related table to avoid ambiguity on pivot joins
        $table = $cloneMax->getModel()->getTable();
        $max = $cloneMax->max("{$table}.updated_at");

        return '"'.md5(($max ?? '0').':'.$count).'"';
    }
}
