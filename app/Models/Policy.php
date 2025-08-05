<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Policy extends Model
{
    protected $fillable = ['type', 'description', 'items'];
    protected $casts = ['items' => 'array'];
}


