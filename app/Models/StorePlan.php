<?php

// app/Models/StorePlan.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StorePlan extends Model
{
    protected $fillable = ['name', 'points', 'price', 'image_url', 'active'];
}
