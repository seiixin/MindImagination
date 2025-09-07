<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StoreCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'additional_points',
        'purchase_cost',
    ];

    protected $casts = [
        'additional_points' => 'integer',
        'purchase_cost'     => 'decimal:2',
    ];
}
