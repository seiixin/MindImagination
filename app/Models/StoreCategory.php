<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

// app/Models/StoreCategory.php
class StoreCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'additional_points',   // <-- add
        'purchase_cost',       // <-- add
    ];
}

